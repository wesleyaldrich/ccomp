use std::fs;
use std::path::{Component, Path, PathBuf};
use serde::Serialize;

/* Struct FileNode 
        children ini bisa isinya kosong -> kalau dia berupa file
*/
#[derive(Serialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
}

/* Untuk validate path
        1. Dilakukan canonicalize (biar sesuai standar)
        2. Dilakukan Penjagaan dimana jika relative_path mengarah keluar folder, tidak akan bisa
        3. Baru dijoin base dir + relative_path

        Contoh canonicalize :
        Current dir : C:\Project\src
        Dikasi path : .\test\..\main
        Hasil akhir : Dari C:\Project\src\test ke C:\Project\src\main
*/
fn validate_child_path(base_dir: &str, relative_path: &str) -> Result<PathBuf, String> {
    let base = Path::new(base_dir)
        .canonicalize()
        .map_err(|e| format!("Direktori dasar tidak valid: {}", e))?;

    let rel = Path::new(relative_path);
    for comp in rel.components() {
        match comp {
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err("Akses keluar folder tidak diizinkan".to_string());
            }
            _ => {}
        }
    }

    Ok(base.join(rel))
}

/* Untuk baca workspace
        1. Cek apakah dia sebuah dir
        2. Melakukan fs::read_dir dimana dia akan baca direktori dan jika Ok maka dia akan ambil path + name
        3. name nya itu melalui beberapa step :
            - ambil file name -> dalam bentuk Option<&OsStr>
            - unwrap_or_default -> jika nama file gagal diambil, maka ganti dengan string kosong
            - to_string_lossy -> ganti dari Option<&OsStr> ke bentuk Cow<str> (string yang aman diproses UTF-8)
            - into_owned -> ganti jadi bentuk String permanen
        4. Jika name nya dimulai dengan '.' (misal .git, dll yang seharusnya di ignore) maka akan lanjut
        5. lalu cek jika path adalah sebuah dir lagi maka, dia akan melakukan rekursi ke dirinya sendiri dan masukkin ke children 
        6. masukkin children ke nodes, dimana nanti akan di sort folder duluan (A-Z), lalu file (A-Z)

*/
#[tauri::command]
pub fn read_workspace_tree(dir_path: String) -> Result<Vec<FileNode>, String> {
    let root_path = Path::new(&dir_path);
    let mut nodes = Vec::new();

    if let Ok(entries) = fs::read_dir(root_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            let name = path.file_name().unwrap_or_default().to_string_lossy().into_owned();
            if name.starts_with('.') { continue; }

            let is_dir = path.is_dir();
            let mut children = None;

            if is_dir {
                if let Ok(sub_nodes) = read_workspace_tree(path.to_string_lossy().to_string()) {
                    children = Some(sub_nodes);
                }
            }

            nodes.push(FileNode { name, path: path.to_string_lossy().to_string(), is_dir, children });
        }
    } else {
        return Err("Gagal membaca folder workspace".to_string());
    }

    nodes.sort_by(|a, b| {
        b.is_dir.cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(nodes)
}

/* Baca isi file (belum dipake harusnya)
        pakai lib fs bawaan Rust untuk baca isi file
*/
#[tauri::command]
pub fn read_file_content(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path).map_err(|e| format!("Gagal membaca file: {}", e))
}

/* Save isi file (belum dipake harusnya)
        pakai lib fs bawaan Rust untuk baca isi file
*/
#[tauri::command]
pub fn save_file_content(file_path: String, content: String) -> Result<(), String> {
    fs::write(&file_path, content).map_err(|e| format!("Gagal menyimpan file: {}", e))
}

/* Buat File Baru :
        1. lakukan validate_child_path -> untuk keamanan + dapetin path lengkap
        2. lalu lakukan pengecekan pembuatan directory yang ga ada, misal
            - dia mau buat /A/B/C/D.txt, namun /A/B/C ini belom ada
            - dia akan gunakan create_dir_all untuk membuat /A/B/C
        3. lalu lakukan fs::write untuk membuat file kosong (ditandakan dengan "")
*/
#[tauri::command]
pub fn create_workspace_file(base_dir: String, relative_path: String) -> Result<String, String> {
    let target = validate_child_path(&base_dir, &relative_path)?;
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&target, "").map_err(|e| format!("Gagal membuat file: {}", e))?;
    Ok(target.to_string_lossy().into_owned())
}

/* Hapus File / Folder yang dipilih 
        dia akan hapus ke Recycle Bin dahulu
*/
#[tauri::command]
pub fn delete_workspace_item(target_path: String) -> Result<(), String> {
    let path = Path::new(&target_path);
    if !path.exists() {
        return Err("File atau folder tidak ditemukan".to_string());
    }

    trash::delete(path).map_err(|e| format!("Gagal memindahkan ke Recycle Bin: {}", e))
}

/* Rename File / Folder yang dipilih */
#[tauri::command]
pub fn rename_workspace_item(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(old_path, new_path).map_err(|e| format!("Gagal mengubah nama: {}", e))
}

/* Buat Folder Baru :
        1. lakukan validate_child_path -> untuk keamanan + dapetin path lengkap
        2. lalu lakukan pembuatan directory bisa 1 tingkat (misal /A) maupun bertingkat (misal /A/B/C)
*/
#[tauri::command]
pub fn create_workspace_folder(base_dir: String, relative_path: String) -> Result<String, String> {
    let target = validate_child_path(&base_dir, &relative_path)?;

    fs::create_dir_all(&target)
        .map_err(|e| format!("Gagal membuat folder: {}", e))?;

    Ok(target.to_string_lossy().into_owned())
}