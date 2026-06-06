import React from 'react';
import { FileNode } from '../../core/types';

interface SidebarProps {
  activeMenu: 'explorer' | 'settings';
  fileSystem: FileNode[];
  onFileSelect: (path: string) => void;
}

export function Sidebar({ activeMenu, fileSystem, onFileSelect }: SidebarProps) {
  return (
    <div className="w-64 bg-[#0d1117] border-r border-[#21262d] flex flex-col text-sm">
      <div className="p-3 uppercase tracking-wider text-xs font-bold text-[#8b949e] border-b border-[#21262d]">
        {activeMenu === 'explorer' ? 'Explorer : Workspace' : 'Settings'}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {activeMenu === 'explorer' ? (
          <div className="space-y-1">
            {fileSystem.map((node) => (
              <FileTreeRender key={node.path} node={node} onFileSelect={onFileSelect} depth={0} />
            ))}
          </div>
        ) : (
          <div className="p-2 space-y-4 text-xs text-[#8b949e]">
            <div className="cursor-pointer hover:text-white">&gt; General</div>
            <div className="cursor-pointer hover:text-white">&gt; Rules</div>
            <div className="cursor-pointer hover:text-white">&gt; Compiler</div>
          </div>
        )}
      </div>
    </div>
  );
}

function FileTreeRender({ node, onFileSelect, depth }: { node: FileNode; onFileSelect: (path: string) => void; depth: number }) {
  const [isOpen, setIsOpen] = React.useState(true);

  if (node.type === 'folder') {
    return (
      <div>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 py-1 px-2 hover:bg-[#21262d] rounded cursor-pointer transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="text-[#8b949e] text-xs transform transition-transform duration-150 inline-block">
            {isOpen ? '▼' : '▶'}
          </span>
          <span className="font-semibold text-[#e6edf3]">{node.name}</span>
        </div>
        {isOpen && node.children && (
          <div className="mt-0.5">
            {node.children.map((child) => (
              <FileTreeRender key={child.path} node={child} onFileSelect={onFileSelect} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={() => onFileSelect(node.path)}
      className="flex items-center space-x-2 py-1 px-2 hover:bg-[#21262d] rounded cursor-pointer transition-colors text-[#c9d1d9]"
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
    >
      <span className="text-blue-400 text-xs">C</span>
      <span>{node.name}</span>
    </div>
  );
}   