import { useEffect, useState, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import iconCComp from "../../../src-tauri/icons/logo_ccomp.svg";
import styles from "./TitleBar.module.css";
import { TitleBarSearch } from "./TitleBarSearch";
import { TitleBarActions } from "./TitleBarActions";
import { openFileFromDisk } from "../CodeEditor/fileActions";

interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children: FileNode[] | null;
}

function TitleBar() {
  const appWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);
  
  // State untuk Command Palette
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [flatFiles, setFlatFiles] = useState<FileNode[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const initializeWindowState = async (): Promise<void> => {
      setIsMaximized(await appWindow.isMaximized());

      unlisten = await appWindow.onResized(async () => {
        setIsMaximized(await appWindow.isMaximized());
      });
    };

    void initializeWindowState();

    return () => {
      unlisten?.();
    };
  }, [appWindow]);

  // Listener untuk shortcut Ctrl+P / Cmd+P dan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Auto-focus input & fetch file tree saat command palette terbuka
  useEffect(() => {
    if (isSearchOpen) {
      if (searchInputRef.current) searchInputRef.current.focus();
      
      const fetchFiles = async () => {
        try {
          const store = await load('ccomp_explorer.json', { autoSave: false });
          const savedPath = await store.get<string>('workspacePath');
          if (savedPath) {
            const data = await invoke<FileNode[]>('read_workspace_tree', { dirPath: savedPath });
            
            const flatten = (nodes: FileNode[]): FileNode[] => {
              let result: FileNode[] = [];
              for (const node of nodes) {
                if (!node.is_dir) result.push(node);
                if (node.children) result = result.concat(flatten(node.children));
              }
              return result;
            };
            
            setFlatFiles(flatten(data));
          }
        } catch (err) {
          console.error("Gagal memuat file explorer untuk pencarian:", err);
        }
      };
      
      void fetchFiles();
    }
  }, [isSearchOpen]);

  const handleDoubleClick = async (): Promise<void> => {
    await appWindow.toggleMaximize();
    setIsMaximized(await appWindow.isMaximized());
  };

  const handleSearchClick = (): void => {
    setIsSearchOpen(true);
  };

  const closeSearch = (): void => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleSelectFile = (path: string): void => {
    openFileFromDisk(path);
    closeSearch();
  };

  const filteredFiles = flatFiles.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mengambil directory path tanpa nama file di ujungnya
  const getDirPath = (path: string) => {
    const parts = path.split(/[/\\]/);
    if (parts.length <= 1) return '';
    return parts.slice(0, -1).slice(-3).join('/'); // Ambil max 3 folder terakhir
  };

  return (
    <>
      <header className={styles.container}>
        <div
          className={styles.content}
          data-tauri-drag-region
          onDoubleClick={handleDoubleClick}
        >
          <div className={styles.brand}>
            <img
              className={styles.logo}
              src={iconCComp}
              alt="CComp IDE"
              draggable={false}
            />
            <span className={styles.appName}>
              CComp IDE
            </span>
          </div>

          <TitleBarSearch onClick={handleSearchClick} />
        </div>

        <TitleBarActions
          isMaximized={isMaximized}
          onMaximizeChange={() => {
            void appWindow.isMaximized().then(setIsMaximized);
          }}
        />
      </header>

      {/* Command Palette */}
      {isSearchOpen && (
        <div className={styles.paletteOverlay} onClick={closeSearch}>
          <div className={styles.paletteContainer} onClick={(e) => e.stopPropagation()}>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.paletteInput}
              placeholder="Search files by name (e.g. main.c)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className={styles.paletteList}>
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => (
                  <div 
                    key={file.path} 
                    className={styles.paletteItem}
                    onClick={() => handleSelectFile(file.path)}
                  >
                    <span className={styles.paletteItemName}>{file.name}</span>
                    <span className={styles.paletteItemPath} title={file.path}>
                      {getDirPath(file.path)}
                    </span>
                  </div>
                ))
              ) : (
                <div className={styles.paletteEmpty}>
                  {searchQuery ? "No matching files found." : "Type to search or open a workspace..."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TitleBar;
