use std::path::Path;
use std::process::Command;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn run_code(app: AppHandle, file_path: String) -> Result<String, String> {
    let source = Path::new(&file_path);

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

    let relative_gcc_path = "toolchains/windows-x86_64/mingw64/bin/gcc.exe";

    let resolved_path = app
        .path()
        .resolve(relative_gcc_path, BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve GCC path: {}", e))?;

    let gcc_path = if resolved_path.is_file() {
        resolved_path
    } else if cfg!(debug_assertions) {
        // Development: use the toolchain directly from src-tauri/
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join(relative_gcc_path)
    } else {
        return Err(format!(
            "Bundled GCC not found: {}",
            resolved_path.display()
        ));
    };

    if !gcc_path.is_file() {
        return Err(format!(
            "GCC executable does not exist: {}",
            gcc_path.display()
        ));
    }

    // Determine executable output path
    let executable = source.with_extension("exe");

    // Locate GCC's supporting binaries
    let bin_dir = gcc_path
        .parent()
        .ok_or("Invalid GCC installation directory.")?;

    let existing_path = std::env::var("PATH").unwrap_or_default();
    let compiler_path = format!("{};{}", bin_dir.display(), existing_path);

    // Compile
    let output = Command::new(&gcc_path)
        .arg(&file_path)
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

    Ok(format!(
        "Compilation successful: {}",
        executable.display()
    ))
}