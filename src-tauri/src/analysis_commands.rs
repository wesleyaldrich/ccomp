use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

#[derive(Serialize)]
pub struct AnalysisResult {
    pub success: bool,
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
}

fn normalize_windows_path(path: PathBuf) -> PathBuf {
    let path_string = path.to_string_lossy();

    match path_string.strip_prefix(r"\\?\") {
        Some(normalized) => PathBuf::from(normalized),
        None => path,
    }
}

fn create_temp_output_path(source: &Path) -> PathBuf {
    let file_stem = source
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("analysis");

    let unique_suffix = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or_default();

    std::env::temp_dir().join(format!(
        "codeeditor-static-analysis-{}-{}.o",
        file_stem, unique_suffix
    ))
}

#[tauri::command]
pub async fn analyze_file(
    app: AppHandle,
    file_path: String,
) -> Result<AnalysisResult, String> {
    let source = PathBuf::from(&file_path);

    if !source.is_file() {
        return Err("Source file does not exist.".to_string());
    }

    let is_c_file = source
        .extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| ext.eq_ignore_ascii_case("c"));

    if !is_c_file {
        return Err("Only C source files are supported.".to_string());
    }

    let relative_gcc_path =
        "toolchains/windows-x86_64/mingw64/bin/gcc.exe";

    let gcc_path = app
        .path()
        .resolve(relative_gcc_path, BaseDirectory::Resource)
        .map_err(|error| format!("Failed to resolve GCC: {}", error))?;

    let gcc_path = normalize_windows_path(gcc_path);

    if !gcc_path.is_file() {
        return Err(format!(
            "GCC executable does not exist: {}",
            gcc_path.display()
        ));
    }

    let temp_output_path = create_temp_output_path(&source);

    tauri::async_runtime::spawn_blocking(move || {
        let bin_dir = gcc_path
            .parent()
            .ok_or_else(|| "Invalid GCC installation directory.".to_string())?;

        let existing_path = std::env::var("PATH").unwrap_or_default();
        let compiler_path = format!("{};{}", bin_dir.display(), existing_path);

        let output = Command::new(&gcc_path)
            .arg(&source)
            .arg("-std=gnu11")
            .arg("-Wall")
            .arg("-Wextra")
            .arg("-fanalyzer")
            .arg("-O0")
            .arg("-c")
            .arg("-o")
            .arg(&temp_output_path)
            .env("PATH", compiler_path)
            .output()
            .map_err(|error| format!("Failed to start GCC: {}", error))?;

        let result = AnalysisResult {
            success: output.status.success(),
            exit_code: output.status.code(),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        };

        let _ = std::fs::remove_file(&temp_output_path);

        Ok(result)
    })
    .await
    .map_err(|error| format!("Analysis task failed: {}", error))?
}