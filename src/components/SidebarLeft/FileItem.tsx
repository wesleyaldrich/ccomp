import { useState } from 'react';
import { VscChevronDown, VscChevronRight } from 'react-icons/vsc';
import { FileNode } from './Explorer';
import { FileIcon } from './FileIcon';
import { useTabStore } from '../CodeEditor/useTabStore';
import { samePath } from '../CodeEditor/pathUtils';
import styles from './FileItem.module.css';

interface FileItemProps {
  node: FileNode;
  onSelectFile?: (filePath: string) => void;
  onRefresh?: () => void;
  onContextMenu?: (e: React.MouseEvent, node: FileNode) => void;
}

export function FileItem({ node, onSelectFile, onRefresh, onContextMenu }: FileItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Item ini sedang dipilih / sedang jadi tab aktif?
  const isSelected = useTabStore(
    (s) => s.selectedPath !== null && samePath(s.selectedPath, node.path)
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    useTabStore.getState().setSelectedPath(node.path);

    if (node.is_dir) {
      setIsOpen((prev) => !prev);
    } else {
      onSelectFile?.(node.path);
    }
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles.itemRow} ${isSelected ? styles.selected : ''}`}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();

          useTabStore.getState().setSelectedPath(node.path);

          if (node.is_dir) {
            setIsOpen(true); // Otomatis buka folder saat diklik kanan
          }

          onContextMenu?.(e, node);
        }}
      >
        <div className={styles.contentWrapper}>
          <span className={styles.arrow}>
            {node.is_dir && (
              isOpen ? <VscChevronDown size={14} /> : <VscChevronRight size={14} />
            )}
          </span>

          <span className={styles.iconWrapper}>
            <FileIcon fileName={node.name} isDir={node.is_dir} isOpen={isOpen} />
          </span>

          <span className={styles.fileName}>{node.name}</span>
        </div>
      </div>

      {/* Render rekursif untuk folder */}
      {node.is_dir && isOpen && node.children && (
        <div className={styles.childrenContainer}>
          {node.children.map((childNode) => (
            <FileItem
              key={childNode.path}
              node={childNode}
              onSelectFile={onSelectFile}
              onRefresh={onRefresh}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}