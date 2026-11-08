use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::io::Write;
use std::time::Instant;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

fn normalize_windows_path(path: PathBuf) -> PathBuf {
    let path_string = path.to_string_lossy();
    match path_string.strip_prefix(r"\\?\") {
        Some(normalized) => PathBuf::from(normalized),
        None => path,
    }
}

pub fn compile_c_code(app: &AppHandle, file_path: &str) -> Result<(PathBuf, String), String> {
    let source = PathBuf::from(file_path);

    if !source.is_file() {
        return Err("Source file does not exist.".to_string());
    }

    if !source
        .extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| ext.eq_ignore_ascii_case("c"))
    {
        return Err("Only C source files are supported.".to_string());
    }

    let current_dir = std::env::current_dir().map_err(|e| format!("Failed to get current dir: {}", e))?;
    let gcc_path = current_dir.join("toolchains/windows-x86_64/mingw64/bin/gcc.exe");

    let gcc_path = normalize_windows_path(gcc_path);

    if !gcc_path.is_file() {
        return Err(format!(
            "GCC executable does not exist: {}",
            gcc_path.display()
        ));
    }

    let version_output = Command::new(&gcc_path)
        .arg("--version")
        .output();

    let mut clean_version = "GCC (Unknown)".to_string();
    if let Ok(v_out) = version_output {
        if v_out.status.success() {
            let stdout_str = String::from_utf8_lossy(&v_out.stdout);
            if let Some(first_line) = stdout_str.lines().next() {
                let parts: Vec<&str> = first_line.split_whitespace().collect();
                if let Some(ver) = parts.last() {
                    clean_version = format!("GCC {}", ver);
                }
            }
        }
    }

    let compiler_info = format!("{} -O2", clean_version);
    let executable = source.with_extension("exe");
    let bin_dir = gcc_path
        .parent()
        .ok_or("Invalid GCC installation directory.")?;

    let existing_path = std::env::var("PATH").unwrap_or_default();
    let compiler_path = format!("{};{}", bin_dir.display(), existing_path);

    let output = Command::new(&gcc_path)
        .arg(&source)
        .arg("-std=gnu11")
        .arg("-O2")
        .arg("-Wall")
        .arg("-Wextra")
        .arg("-o")
        .arg(&executable)
        .env("PATH", compiler_path)
        .output()
        .map_err(|e| format!("Failed to start GCC: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok((executable, compiler_info))
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct TestCaseResult {
    pub id: String,
    pub passed: bool,
    pub actual_output: String,
    pub error: Option<String>,
    pub duration_ms: u128,
    pub memory_kb: u64,
    pub compiler_version: String,
}

#[cfg(target_os = "windows")]
fn get_process_memory_usage(process_handle: std::os::windows::io::RawHandle) -> u64 {
    use std::os::raw::c_void;

    #[repr(C)]
    #[allow(non_snake_case)]
    #[allow(non_camel_case_types)]
    struct PROCESS_MEMORY_COUNTERS {
        cb: u32,
        PageFaultCount: u32,
        PeakWorkingSetSize: usize,
        WorkingSetSize: usize,
        QuotaPeakPagedPoolUsage: usize,
        QuotaPagedPoolUsage: usize,
        QuotaPeakNonPagedPoolUsage: usize,
        QuotaNonPagedPoolUsage: usize,
        PagefileUsage: usize,
        PeakPagefileUsage: usize,
    }

    unsafe extern "system" {
        fn GetProcessMemoryInfo(
            hProcess: *mut c_void,
            ppsmemCounters: *mut PROCESS_MEMORY_COUNTERS,
            cb: u32,
        ) -> i32;
    }

    let mut counters = PROCESS_MEMORY_COUNTERS {
        cb: std::mem::size_of::<PROCESS_MEMORY_COUNTERS>() as u32,
        PageFaultCount: 0,
        PeakWorkingSetSize: 0,
        WorkingSetSize: 0,
        QuotaPeakPagedPoolUsage: 0,
        QuotaPagedPoolUsage: 0,
        QuotaPeakNonPagedPoolUsage: 0,
        QuotaNonPagedPoolUsage: 0,
        PagefileUsage: 0,
        PeakPagefileUsage: 0,
    };

    unsafe {
        let success = GetProcessMemoryInfo(
            process_handle as *mut c_void,
            &mut counters,
            counters.cb,
        );
        if success != 0 {
            return (counters.PeakWorkingSetSize as u64) / 1024;
        }
    }
    
    256
}

#[tauri::command]
pub async fn run_test_cases(
    app: AppHandle,
    file_path: String,
    test_cases: Vec<serde_json::Value>,
) -> Result<Vec<TestCaseResult>, String> {
    let app_clone = app.clone();
    let fp = file_path.clone();

    tauri::async_runtime::spawn_blocking(move || {
        let (executable, compiler_version) = match compile_c_code(&app_clone, &fp) {
            Ok(res) => res,
            Err(compile_err) => {
                let mut results = vec![];
                for tc in test_cases {
                    if let Some(id) = tc.get("id").and_then(|v| v.as_str()) {
                        results.push(TestCaseResult {
                            id: id.to_string(),
                            passed: false,
                            actual_output: "".to_string(),
                            error: Some(format!("Compilation Error:\n{}", compile_err)),
                            duration_ms: 0,
                            memory_kb: 0,
                            compiler_version: "GCC (Compilation Failed)".to_string(),
                        });
                    }
                }
                return Ok(results);
            }
        };

        let mut results = vec![];

        for tc in test_cases {
            let id = tc.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let input = tc.get("input").and_then(|v| v.as_str()).unwrap_or("").trim();
            let expected = tc.get("expectedOutput").and_then(|v| v.as_str()).unwrap_or("").trim();

            if input.is_empty() {
                results.push(TestCaseResult {
                    id,
                    passed: false,
                    actual_output: "".to_string(),
                    error: Some("Error: Test case input cannot be empty.".to_string()),
                    duration_ms: 0,
                    memory_kb: 0,
                    compiler_version: compiler_version.clone(),
                });
                continue;
            }

            let start_time = Instant::now();

            let mut child = match Command::new(&executable)
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
            {
                Ok(c) => c,
                Err(e) => {
                    let duration_ms = start_time.elapsed().as_millis();
                    results.push(TestCaseResult {
                        id,
                        passed: false,
                        actual_output: "".to_string(),
                        error: Some(format!("Failed to spawn process: {}", e)),
                        duration_ms,
                        memory_kb: 0,
                        compiler_version: compiler_version.clone(),
                    });
                    continue;
                }
            };

            if let Some(stdin) = child.stdin.as_mut() {
                let _ = stdin.write_all(input.as_bytes());
            }

            #[cfg(target_os = "windows")]
            let raw_handle = std::os::windows::io::AsRawHandle::as_raw_handle(&child);

            match child.wait_with_output() {
                Ok(output) => {
                    let duration_ms = start_time.elapsed().as_millis();
                    
                    #[cfg(target_os = "windows")]
                    let memory_kb = get_process_memory_usage(raw_handle);
                    #[cfg(not(target_os = "windows"))]
                    let memory_kb = 256;

                    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

                    if !output.status.success() && !stderr.is_empty() {
                        results.push(TestCaseResult {
                            id,
                            passed: false,
                            actual_output: stdout,
                            error: Some(stderr),
                            duration_ms,
                            memory_kb,
                            compiler_version: compiler_version.clone(),
                        });
                    } else {
                        let normalized_actual = stdout.replace("\r\n", "\n");
                        let normalized_expected = expected.replace("\r\n", "\n");

                        let passed = normalized_actual == normalized_expected;
                        results.push(TestCaseResult {
                            id,
                            passed,
                            actual_output: stdout,
                            error: None,
                            duration_ms,
                            memory_kb,
                            compiler_version: compiler_version.clone(),
                        });
                    }
                }
                Err(e) => {
                    let duration_ms = start_time.elapsed().as_millis();
                    results.push(TestCaseResult {
                        id,
                        passed: false,
                        actual_output: "".to_string(),
                        error: Some(format!("Execution failed: {}", e)),
                        duration_ms,
                        memory_kb: 256,
                        compiler_version: compiler_version.clone(),
                    });
                }
            }
        }

        let _ = std::fs::remove_file(&executable);

        Ok(results)
    })
    .await
    .map_err(|e| format!("Test execution task failed: {}", e))?
}
