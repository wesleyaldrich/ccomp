// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

/* import fs_commands -> beriwsi logic command" file system */
mod fs_commands;
mod run_commands;
mod search_commands;
mod test_commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            fs_commands::read_workspace_tree,
            fs_commands::create_workspace_file,
            fs_commands::delete_workspace_item,
            fs_commands::rename_workspace_item,
            fs_commands::create_workspace_folder,
            fs_commands::read_file_content,
            fs_commands::save_file_content,
            run_commands::run_code,
            test_commands::run_test_cases,
            search_commands::search_in_files,
            search_commands::replace_in_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
