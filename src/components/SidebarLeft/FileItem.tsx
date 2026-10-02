// import { useState } from 'react';
// import { invoke } from '@tauri-apps/api/core';
// /* untuk tab saat click kanan */
// import { Menu, MenuItem } from '@tauri-apps/api/menu';
// import { FileNode } from './Explorer';
// import { FileIcon } from './FileIcon';
// import { VscChevronDown, VscChevronRight } from 'react-icons/vsc';
// import styles from './FileItem.module.css'; // Import CSS Module

// interface FileItemProps {
//   node: FileNode;
//   onSelectFile?: (filePath: string) => void;
//   onRefresh?: () => void;
// }

// export function FileItem({ node, onSelectFile, onRefresh }: FileItemProps) {
//   const [isOpen, setIsOpen] = useState(false);

//   /* Buat File baru didalam Folder */
//   const handleCreateFileInFolder = async () => {
//     const fileName = window.prompt(`Buat file baru di dalam "${node.name}":`);
//     if (!fileName || fileName.trim() === '') return;

//     try {
//       await invoke('create_workspace_file', {
//         baseDir: node.path,
//         relativePath: fileName.trim(),
//       });
//       /* akan set Open tree (bentukan panah dropdown) itu true dan akan refresh sehingga 
//       akan menjalankan ulang invoke('read_workspace_tree') ke Rust untuk membaca ulang isi folder dari disk. */      setIsOpen(true);
//       onRefresh?.();
//     } catch (err) {
//       alert(`Gagal membuat file: ${err}`);
//     }
//   };

//   /* Buat Folder baru */
//   const handleCreateSubFolder = async () => {
//     const folderName = window.prompt(`Buat sub-folder baru di dalam "${node.name}":`);
//     if (!folderName || folderName.trim() === '') return;

//     try {
//       await invoke('create_workspace_folder', {
//         baseDir: node.path,
//         relativePath: folderName.trim(),
//       });
//       /* akan set Open tree (bentukan panah dropdown) itu true dan akan refresh sehingga 
//       akan menjalankan ulang invoke('read_workspace_tree') ke Rust untuk membaca ulang isi folder dari disk. */
//       setIsOpen(true);
//       onRefresh?.();
//     } catch (err) {
//       alert(`Gagal membuat folder: ${err}`);
//     }
//   };

//   /* Buat Rename file maupun folder baru */
//   const handleRename = async () => {
//     const newName = window.prompt(`Ubah nama "${node.name}" menjadi:`, node.name);
//     if (!newName || newName.trim() === '' || newName === node.name) return;

//     const separator = node.path.includes('\\') ? '\\' : '/';
//     const parentPath = node.path.substring(0, node.path.lastIndexOf(separator));
//     const newPath = `${parentPath}${separator}${newName.trim()}`;

//     try {
//       await invoke('rename_workspace_item', {
//         oldPath: node.path,
//         newPath: newPath,
//       });
//       onRefresh?.();
//     } catch (err) {
//       alert(`Gagal mengubah nama: ${err}`);
//     }
//   };

//   /* Buat Hapus File / Folder */
//   const handleDelete = async () => {
//     const confirmed = window.confirm(`Hapus "${node.name}"?`);
//     if (!confirmed) return;

//     try {
//       await invoke('delete_workspace_item', { targetPath: node.path });
//       onRefresh?.();
//     } catch (err) {
//       alert(`Gagal menghapus: ${err}`);
//     }
//   };

//   /* Buat Keluarin tab kalo di klik kanan (bisa pada folder / file) */
//   const handleContextMenu = async (e: React.MouseEvent) => {
//     e.preventDefault(); // Biar menu klik kanan bawaan browser ga kebuka
//     e.stopPropagation(); // Biar klik kanan naik ke folder parentnya ga bisa

//     const menuItems = [];

//     // Jika item berupa folder, tampilkan opsi pembuat file & folder
//     if (node.is_dir) {
//       menuItems.push(
//         await MenuItem.new({
//           text: 'New File',
//           action: () => handleCreateFileInFolder(),
//         }),
//         await MenuItem.new({
//           text: 'New Folder',
//           action: () => handleCreateSubFolder(),
//         })
//       );
//     }

//     // Opsi Rename dan Delete (selalu muncul untuk file dan folder)
//     menuItems.push(
//       await MenuItem.new({
//         text: 'Rename',
//         action: () => handleRename(),
//       }),
//       await MenuItem.new({
//         text: 'Delete',
//         action: () => handleDelete(),
//       })
//     );


//     /* bilangnya si dia ini pake Menu bawaan OS (ini ada di lib tauri-apps/api/core) */
//     const menu = await Menu.new({ items: menuItems });
//     await menu.popup();
//   };

//   return (
//     <div className={styles.container}>
//       <div
//         className={styles.itemRow}
//         onClick={() => (node.is_dir ? setIsOpen(!isOpen) : onSelectFile?.(node.path))}
//         onContextMenu={handleContextMenu}
//       >
//         <div className={styles.contentWrapper}>
//           {/* Panah di sebelah folder (bakal panah bawah kalo kebukan dan panah kanan kalo ketutup) */}
//           <span className={styles.arrow}>
//             {node.is_dir && (
//               isOpen ? <VscChevronDown size={14} /> : <VscChevronRight size={14} />
//             )}
//           </span>

//           {/* FileIcon */}
//           <span className={styles.iconWrapper}>
//             <FileIcon fileName={node.name} isDir={node.is_dir} isOpen={isOpen} />
//           </span>

//           {/* Nama File / Folder */}
//           <span className={styles.fileName}>{node.name}</span>
//         </div>
//       </div>

//       {/* Render Folder + kalo ada isinya */}
//       {node.is_dir && isOpen && node.children && (
//         <div className={styles.childrenContainer}>
//           {node.children.map((childNode) => (
//             <FileItem
//               key={childNode.path}
//               node={childNode}
//               onSelectFile={onSelectFile}
//               onRefresh={onRefresh}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

import { useState } from 'react';
import { VscChevronDown, VscChevronRight } from 'react-icons/vsc';
import { FileNode } from './Explorer';
import { FileIcon } from './FileIcon';
import styles from './FileItem.module.css';

interface FileItemProps {
  node: FileNode;
  onSelectFile?: (filePath: string) => void;
  onRefresh?: () => void;
}

export function FileItem({ node, onSelectFile, onRefresh }: FileItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.container}>
      <div
        className={styles.itemRow}
        onClick={() => (node.is_dir ? setIsOpen(!isOpen) : onSelectFile?.(node.path))}
      >
        <div className={styles.contentWrapper}>
          {/* Panah Indikator Dropdown */}
          <span className={styles.arrow}>
            {node.is_dir && (
              isOpen ? <VscChevronDown size={14} /> : <VscChevronRight size={14} />
            )}
          </span>

          {/* Ikon File / Folder */}
          <span className={styles.iconWrapper}>
            <FileIcon fileName={node.name} isDir={node.is_dir} isOpen={isOpen} />
          </span>

          {/* Nama File / Folder */}
          <span className={styles.fileName}>{node.name}</span>
        </div>
      </div>

      {/* Render Anak Folder Secara Rekursif */}
      {node.is_dir && isOpen && node.children && (
        <div className={styles.childrenContainer}>
          {node.children.map((childNode) => (
            <FileItem
              key={childNode.path}
              node={childNode}
              onSelectFile={onSelectFile}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}