import { useState, useEffect, useRef } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { VscNewFile, VscNewFolder, VscRefresh, VscTrash } from 'react-icons/vsc';
import { FileItem } from './FileItem';
import styles from './Explorer.module.css';

/* Initialize beberapa interface yang dipake */
export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children: FileNode[] | null;
}

interface ExplorerProps {
  onSelectFile?: (filePath: string) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  node?: FileNode; // Node spesifik jika klik kanan dilakukan di atas file/folder
}

type ModalType = 'file' | 'folder' | 'rename' | 'delete' | null;

export function Explorer({ onSelectFile }: ExplorerProps) {
  /* Simpan path folder yang lagi dibuka */
  const [workspacePath, setWorkspacePath] = useState<string>('');
  /* Simpan hierarki folder dan file  */
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  
  /* Simpan posisi (x,y) dari kursor pas klik kanan */
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  /* Simpan modal type yang lagi aktif */
  const [modalType, setModalType] = useState<ModalType>(null);
  const [inputName, setInputName] = useState<string>('');
  const [nodeToDelete, setNodeToDelete] = useState<FileNode | null>(null);
  const [nodeToRename, setNodeToRename] = useState<FileNode | null>(null);

  const chordActiveRef = useRef<boolean>(false);
  const chordTimeoutRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  /* Auto-focus pas modal crate file / folder muncul (jadi gelap belakangnya*/
  useEffect(() => {
    if (modalType === 'file' || modalType === 'folder') {
      setTimeout(() => modalInputRef.current?.focus(), 50);
    }
  }, [modalType]);

  /* Reload isi folder agar tampilan sinkron dengan disk dimana dia baca workspace_tree ama setFileTree */
  async function refreshTree(path = workspacePath) {
    if (!path) return;
    try {
      const data = await invoke<FileNode[]>('read_workspace_tree', { dirPath: path });
      setFileTree(data);
    } catch (err) {
      console.error('Gagal memuat folder workspace:', err);
    }
  }

  /* Buka workspace yang dituju */
  async function handleOpenWorkspace() {
    const selected = await open({ directory: true, multiple: false });
    if (selected && typeof selected === 'string') {
      setWorkspacePath(selected);
      await refreshTree(selected);
    }
  }

  /* Buka Modal (yang tampilan buat create) */
  function openCreateModal(type: 'file' | 'folder') {
    setContextMenu(null);
    setInputName('');
    setModalType(type);
  }

  /* Buka Modal (yang tampilan buat hapus) */
  function openDeleteConfirm(node: FileNode) {
    setContextMenu(null);
    setNodeToDelete(node);
    setModalType('delete');
  }

  /* Hapus file / folder pake delete_workspace_item */
  async function handleDeleteSubmit() {
    if (!nodeToDelete) return;

    try {
      await invoke('delete_workspace_item', { targetPath: nodeToDelete.path });
      await refreshTree();
    } catch (err) {
      alert(`Gagal menghapus item: ${err}`);
    } finally {
      setModalType(null);
      setNodeToDelete(null);
    }
  }

  // Fungsi membuka modal Rename
function openRenameModal(node: FileNode) {
  setContextMenu(null);
  setNodeToRename(node);
  setInputName(node.name); // Isi nama sedia ada sebagai default
  setModalType('rename');
}

// Fungsi mengeksekusi penukaran nama via Tauri
async function handleRenameSubmit() {
  if (!nodeToRename || !inputName.trim() || inputName.trim() === nodeToRename.name) {
    setModalType(null);
    return;
  }

  const separator = nodeToRename.path.includes('\\') ? '\\' : '/';
  const parentPath = nodeToRename.path.substring(0, nodeToRename.path.lastIndexOf(separator));
  const newPath = `${parentPath}${separator}${inputName.trim()}`;

  try {
    await invoke('rename_workspace_item', {
      oldPath: nodeToRename.path,
      newPath: newPath,
    });
    await refreshTree();
  } catch (err) {
    alert(`Gagal mengubah nama: ${err}`);
  } finally {
    setModalType(null);
    setNodeToRename(null);
    setInputName('');
  }
}

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCtrl = e.ctrlKey || e.metaKey;

      
      /* Shortcut: Ctrl + K untuk mode tunggu (?) */
      if (isCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        chordActiveRef.current = true;

        if (chordTimeoutRef.current) clearTimeout(chordTimeoutRef.current);
        chordTimeoutRef.current = window.setTimeout(() => {
          chordActiveRef.current = false;
        }, 2000);
        return;
      }

      /* Shortcut: Ctrl + o untuk buka explorer local */
      if (chordActiveRef.current && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        chordActiveRef.current = false;
        if (chordTimeoutRef.current) clearTimeout(chordTimeoutRef.current);
        handleOpenWorkspace();
        return;
      }

      if (!workspacePath || modalType) return;

      /* Shortcut: Ctrl + Shift + N untuk New Folder */
      if (isCtrl && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openCreateModal('folder');
        return;
      }

      /* Shortcut: Ctrl + N utnuk New File */
      if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openCreateModal('file');
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (chordTimeoutRef.current) clearTimeout(chordTimeoutRef.current);
    };
  }, [workspacePath, modalType]);


  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }

    function handleScroll() {
      setContextMenu(null);
    }

    if (contextMenu) {
      window.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [contextMenu]);

  
  /* Handle Submit Modal Create file / folder  */
  async function handleModalSubmit() {
    if (!inputName.trim() || !workspacePath) return;

    const trimmed = inputName.trim();
    try {
      if (modalType === 'file') {
        await invoke('create_workspace_file', {
          baseDir: workspacePath,
          relativePath: trimmed,
        });
      } else if (modalType === 'folder') {
        await invoke('create_workspace_folder', {
          baseDir: workspacePath,
          relativePath: trimmed,
        });
      }
      await refreshTree();
    } catch (err) {
      alert(`Gagal membuat ${modalType}: ${err}`);
    } finally {
      setModalType(null);
      setInputName('');
    }
  }

  /* Untuk handle click kanan (dia itung koordinat x dan y) */
  const handleContextMenu = (e: React.MouseEvent, node?: FileNode) => {
    if (!workspacePath) return;

    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 190;
    const menuHeight = node ? 140 : 110;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 4;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 4;

    setContextMenu({ x, y, node });
  };

  const rootName = workspacePath.replace(/[/\\]+$/, '').split(/[/\\]/).pop() || workspacePath;

  // ga sempet gimana cek, maapkeun
  return (
    <div className={styles.explorerContainer}>
      {/* Header bar Explorer & Action Buttons */}
      <div className={styles.headerBar}>
        <span className={styles.headerTitle}>Explorer</span>
        {workspacePath && (
          <div className={styles.actionGroup}>
            <button
              onClick={() => openCreateModal('file')}
              title="New File (Ctrl+N)"
              className={styles.actionButton}
            >
              <VscNewFile size={15} />
            </button>
            <button
              onClick={() => openCreateModal('folder')}
              title="New Folder (Ctrl+Shift+N)"
              className={styles.actionButton}
            >
              <VscNewFolder size={15} />
            </button>
          </div>
        )}
      </div>

      {/* State jika belum ada folder dibuka */}
      {fileTree.length === 0 && !workspacePath ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No folder opened</p>
          <button onClick={handleOpenWorkspace} className={styles.openFolderButton}>
            Open Folder
          </button>
        </div>
      ) : (
        /* State saat folder sudah aktif */
        <div onContextMenu={(e) => handleContextMenu(e)} className={styles.treeContainer}>
          <div className={styles.rootName}>{rootName}</div>
          <div className={styles.treeList}>
            {fileTree.map((node) => (
              <div key={node.path} onContextMenu={(e) => handleContextMenu(e, node)}>
                <FileItem
                  node={node}
                  onSelectFile={onSelectFile}
                  onRefresh={() => refreshTree()}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUSTOM CONTEXT MENU */}
      {contextMenu && (
        <div
          ref={menuRef}
          className={styles.contextMenu}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          <ContextMenuItem label="New File..." shortcut="Ctrl+N" onClick={() => openCreateModal('file')} />
          <ContextMenuItem label="New Folder..." shortcut="Ctrl+Shift+N" onClick={() => openCreateModal('folder')} />

          {contextMenu.node && (
            <>
              <div className={styles.menuDivider} />
              <ContextMenuItem
                label="Rename..."
                onClick={() => openRenameModal(contextMenu.node!)}
              />
              <ContextMenuItem
                label="Delete"
                shortcut="Delete"
                icon={<VscTrash size={13} style={{ color: '#f87171' }} />}
                onClick={() => openDeleteConfirm(contextMenu.node!)}
              />
            </>
          )}

          <div className={styles.menuDivider} />
          <ContextMenuItem
            label="Refresh Explorer"
            icon={<VscRefresh size={13} />}
            onClick={() => {
              setContextMenu(null);
              refreshTree();
            }}
          />
        </div>
      )}

      {/* CUSTOM DIALOG: CREATE / RENAME */}
      {(modalType === 'file' || modalType === 'folder' || modalType === 'rename') && (
        <div className={styles.modalOverlay} onClick={() => setModalType(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              {modalType === 'rename'
                ? `Rename '${nodeToRename?.name}'`
                : `Create New ${modalType === 'file' ? 'File' : 'Folder'}`}
            </div>
            <input
              ref={modalInputRef}
              type="text"
              placeholder={modalType === 'file' ? 'e.g., index.ts' : 'e.g., components'}
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  modalType === 'rename' ? handleRenameSubmit() : handleModalSubmit();
                }
                if (e.key === 'Escape') setModalType(null);
              }}
              className={styles.modalInput}
            />
            <div className={styles.modalActions}>
              <button onClick={() => setModalType(null)} className={`${styles.btnBase} ${styles.btnCancel}`}>
                Cancel
              </button>
              <button
                onClick={modalType === 'rename' ? handleRenameSubmit : handleModalSubmit}
                className={`${styles.btnBase} ${styles.btnConfirm}`}
              >
                {modalType === 'rename' ? 'Rename' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DIALOG: KONFIRMASI DELETE */}
      {modalType === 'delete' && nodeToDelete && (
        <div className={styles.modalOverlay} onClick={() => setModalType(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Confirm Delete</div>
            <p className={styles.modalDescription}>
              Are you sure you want to delete <strong className={styles.highlightText}>'{nodeToDelete.name}'</strong>?
              {nodeToDelete.is_dir && ' This will also delete all files inside it.'}
            </p>
            <div className={styles.modalActions}>
              <button onClick={() => setModalType(null)} className={`${styles.btnBase} ${styles.btnCancel}`}>
                Cancel
              </button>
              <button onClick={handleDeleteSubmit} className={`${styles.btnBase} ${styles.btnDelete}`}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-komponen Item Context Menu (Bebas dari State & Hover JS)
function ContextMenuItem({
  label,
  shortcut,
  onClick,
  icon,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div onClick={onClick} className={styles.menuItem}>
      <span>{label}</span>
      {shortcut && <span className={styles.shortcut}>{shortcut}</span>}
      {icon && <span className={styles.menuIcon}>{icon}</span>}
    </div>
  );
}