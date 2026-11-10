
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

// Remove Windows extended-length path prefix when present.
fn normalize_windows_path(path: PathBuf) -> PathBuf {
    let path_string = path.to_string_lossy();

    match path_string.strip_prefix(r"\\?\") {
        Some(normalized) => PathBuf::from(normalized),
        None => path,
    }
}

#[tauri::command]
pub async fn run_code(
    app: AppHandle,
    file_path: String,
) -> Result<String, String> {
    let source = PathBuf::from(&file_path);

    // Validate source file
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

    // Always resolve GCC from Tauri resources.
    // This works in both development and production.
    let relative_gcc_path =
        "toolchains/windows-x86_64/mingw64/bin/gcc.exe";

    let gcc_path = app
        .path()
        .resolve(relative_gcc_path, BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve GCC: {}", e))?;

    let gcc_path = normalize_windows_path(gcc_path);

    if !gcc_path.is_file() {
        return Err(format!(
            "GCC executable does not exist: {}",
            gcc_path.display()
        ));
    }

    let executable = source.with_extension("exe");
    let working_dir = source
        .parent()
        .unwrap_or(Path::new("."))
        .to_path_buf();

    // Perform compilation and execution outside the main thread.
    tauri::async_runtime::spawn_blocking(move || {
        let bin_dir = gcc_path
            .parent()
            .ok_or("Invalid GCC installation directory.")?;

        let existing_path = std::env::var("PATH").unwrap_or_default();
        let compiler_path =
            format!("{};{}", bin_dir.display(), existing_path);

        // Compile
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

        // Launch executable in a new CMD window.
        const CREATE_NEW_CONSOLE: u32 = 0x00000010;

        let command = format!(
            " \"\"{}\"\"",
            executable.display()
        );

        Command::new("cmd.exe")
            .arg("/K")
            .raw_arg(command)
            .current_dir(&working_dir)
            .creation_flags(CREATE_NEW_CONSOLE)
            .spawn()
            .map_err(|e| format!("Failed to launch executable: {}", e))?;

        Ok(format!(
            "Compilation successful: {}",
            executable.display()
        ))
    })
    .await
    .map_err(|e| format!("Compilation task failed: {}", e))?
}