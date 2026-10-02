// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

/* import fs_commands -> beriwsi logic command" file system */
mod fs_commands;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello again 2, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet,
            fs_commands::read_workspace_tree,
            fs_commands::create_workspace_file,
            fs_commands::delete_workspace_item,
            fs_commands::rename_workspace_item,
            fs_commands::create_workspace_folder])

        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
