import { useState } from 'react';
import { VscChevronDown, VscChevronRight } from 'react-icons/vsc';
import { FileNode } from './Explorer';
import { FileIcon } from './FileIcon';
import styles from './FileItem.module.css';

interface FileItemProps {
  node: FileNode;
  onSelectFile?: (filePath: string) => void;
  onRefresh?: () => void;
  onContextMenu?: (e: React.MouseEvent, node: FileNode) => void;
}

// FileItem.tsx
export function FileItem({ node, onSelectFile, onRefresh, onContextMenu }: FileItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.container}>
      <div
        className={styles.itemRow}
        onClick={() => (node.is_dir ? setIsOpen(!isOpen) : onSelectFile?.(node.path))}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (node.is_dir) {
            setIsOpen(true); // 👈 OTOMATIS BUKA FOLDER saat diklik kanan!
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