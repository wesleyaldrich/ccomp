import React, { useState, useEffect, useRef } from 'react';
import { FileNode } from '../../core/types';

interface SidebarProps {
  activeMenu: 'explorer' | 'settings' | null;
  fileSystem: FileNode[];
  onFileSelect: (path: string) => void;
  onImportWorkspace?: () => void;
  onCloseWorkspace?: () => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (val: boolean) => void;
}

const AddFileIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 2L14 5.5V14H2V2h8.5zm-.5 1H3v10h10V6.5H9.5V3zM10 3.5V6h2.5L10 3.5z"/><path d="M7 8h2v2h2v1H9v2H7v-2H5v-1h2V8z"/></svg>;
const AddFolderIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14 4h-4.5L8 2H2v12h12V4zm-1 1v8H3V3h4.5l1.5 2H13z"/><path d="M7 7h2v2h2v1H9v2H7v-2H5v-1h2V7z"/></svg>;
const RefreshIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M12.5 4l-1.5 1.5A4.5 4.5 0 1 0 13.5 8h1A5.5 5.5 0 1 1 11 3.2L12.5 1.7V4z"/></svg>;
const CollapseIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14 1H2v2h12V1zM2 13h12v2H2v-2zm2-4h8v2H4V9z"/></svg>;
const ChevronRight = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 4L10 8L6 12" /></svg>;
const ChevronDown = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6L8 10L12 6" /></svg>;

const getFileIcon = (name: string) => {
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return <span className="text-[#3178c6] font-bold text-[11px] w-4 h-4 flex items-center justify-center shrink-0">TS</span>;
  if (name.endsWith('.css')) return <span className="text-[#519aba] font-bold text-[13px] w-4 h-4 flex items-center justify-center shrink-0">#</span>;
  if (name.endsWith('.svg')) return <span className="text-[#a074c4] font-bold text-[14px] w-4 h-4 flex items-center justify-center shrink-0">◩</span>;
  return <svg className="w-4 h-4 text-[#8b949e] shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M13 4.5l-3-3H3v13h10V4.5zM9.5 2.5L12 5H9.5V2.5zM4 13.5v-11h4.5V6H12v7.5H4z"/></svg>;
};

const getGitStatus = (name: string) => {
  if (name.includes('svg') || name.includes('css')) return { text: 'U', color: 'text-[#73c991]' };
  if (name.includes('tsx') || name.includes('ts')) return { text: 'M', color: 'text-[#e2c08d]' };
  return null;
};

export function Sidebar({ activeMenu, fileSystem, onFileSelect, onImportWorkspace, onCloseWorkspace, isMenuOpen, setIsMenuOpen }: SidebarProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, setIsMenuOpen]);

  if (!activeMenu) return null;

  return (
    <div className="w-full h-full flex flex-col font-sans select-none bg-[#181818] text-[#cccccc]">
      
      {/* HEADER: EXPLORER */}
      <div 
        className="flex justify-between items-center text-[11px] text-[#cccccc] tracking-wider font-semibold relative"
        style={{ marginTop: '14px', marginBottom: '10px', paddingLeft: '24px', paddingRight: '16px' }}
      >
        <span>EXPLORER</span>
        
        <div ref={menuRef} className="relative">
          <div 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`cursor-pointer p-[2px] rounded transition-colors ${isMenuOpen ? 'bg-[#2a2d32] text-white' : 'hover:bg-[#2a2d32] text-[#cccccc] hover:text-white'}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
          </div>

          {isMenuOpen && (
            <div 
              className="absolute right-0 top-full mt-1.5 min-w-[260px] bg-[#252526] border border-[#454545] shadow-2xl z-50 normal-case tracking-normal font-normal"
              style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
            >
              <MenuItem label="New File..." shortcut="Ctrl+N" onClick={() => { setIsMenuOpen(false); alert('Fitur New File akan diimplementasikan nanti!'); }} />
              <MenuItem label="New Folder..." shortcut="Ctrl+Shift+N" onClick={() => { setIsMenuOpen(false); alert('Fitur New Folder akan diimplementasikan nanti!'); }} />
              <MenuDivider />
              <MenuItem label="Open Folder..." shortcut="Ctrl+K Ctrl+O" onClick={() => { setIsMenuOpen(false); if (onImportWorkspace) onImportWorkspace(); }} />
              <MenuDivider />
              <MenuItem label="Save All" shortcut="Ctrl+K S" onClick={() => { setIsMenuOpen(false); alert('Semua file berhasil disimpan!'); }} />
              <MenuDivider />
              <MenuItem label="Close Folder" shortcut="Ctrl+K F" onClick={() => { setIsMenuOpen(false); if (onCloseWorkspace) onCloseWorkspace(); }} />
            </div>
          )}
        </div>
      </div>
      
      {/* BODY: ROOT FOLDER */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto min-w-0 flex flex-col custom-scrollbar pb-4">
        {activeMenu === 'explorer' && (
          fileSystem.length === 0 ? (
            /* --- EMPTY STATE --- */
            <div className="flex flex-col gap-3" style={{ paddingLeft: '24px', paddingRight: '24px', marginTop: '4px', gap: '8px' }}>
              <span className="text-[13px] text-[#cccccc]">You have not yet opened a folder.</span>
              <button 
                onClick={onImportWorkspace} 
                className="w-full text-white text-[13px] py-[6px] hover:brightness-110 transition-all cursor-pointer"
                style={{ color: '#ffffff', backgroundColor: '#0f3bb6', borderRadius: '5px', border: 'none' }}
              >
                Open Folder
              </button>
            </div>
          ) : (
            fileSystem.map((node, idx) => (
              <RootFolderRender key={node.path || idx} node={node} onFileSelect={onFileSelect} />
            ))
          )
        )}
      </div>
    </div>
  );
}

function MenuItem({ label, shortcut, onClick }: { label: string, shortcut?: string, onClick: () => void }) {
  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex justify-between items-center hover:bg-[#04395e] hover:text-white cursor-pointer text-[13px] text-[#cccccc] transition-colors whitespace-nowrap group"
      style={{ paddingRight: '22px', paddingTop: '6px', paddingBottom: '6px' }}
    >
      <div className="flex items-center">
        <div style={{ width: '24px' }} className="shrink-0 flex items-center justify-center" />
        <span>{label}</span>
      </div>
      <div className="text-right">
        {shortcut && <span className="text-[#858585] group-hover:text-[#b0b0b0] text-[12px]">{shortcut}</span>}
      </div>
    </div>
  );
}

function MenuDivider() {
  return <div className="h-px bg-[#454545]" style={{ marginTop: '4px', marginBottom: '4px', marginLeft: '12px', marginRight: '12px' }} />;
}

function RootFolderRender({ node, onFileSelect }: { node: FileNode; onFileSelect: (path: string) => void }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex flex-col mb-1">
      <div 
        className="group flex items-center justify-between h-[22px] cursor-pointer hover:bg-[#2a2d32] transition-colors font-bold text-[#cccccc]"
        style={{ paddingLeft: '4px', paddingRight: '8px' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-[2px] overflow-hidden">
          <span className="w-5 h-5 flex items-center justify-center shrink-0 transition-transform">
            {isOpen ? <ChevronDown /> : <ChevronRight />}
          </span>
          <span className="text-[11px] uppercase tracking-wide truncate">{node.name}</span>
        </div>

        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-[2px]" onClick={e => e.stopPropagation()}>
          <div className="p-1 hover:bg-[#3d4145] rounded text-[#cccccc] hover:text-white" title="New File"><AddFileIcon /></div>
          <div className="p-1 hover:bg-[#3d4145] rounded text-[#cccccc] hover:text-white" title="New Folder"><AddFolderIcon /></div>
          <div className="p-1 hover:bg-[#3d4145] rounded text-[#cccccc] hover:text-white" title="Refresh Explorer"><RefreshIcon /></div>
          <div className="p-1 hover:bg-[#3d4145] rounded text-[#cccccc] hover:text-white" title="Collapse Folders" onClick={() => setIsOpen(false)}><CollapseIcon /></div>
        </div>
      </div>

      {isOpen && node.children?.map(c => (
        <FileTreeRender key={c.path} node={c} onFileSelect={onFileSelect} depth={1} />
      ))}
    </div>
  );
}

function FileTreeRender({ node, onFileSelect, depth }: { node: FileNode; onFileSelect: (path: string) => void; depth: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.type === 'folder';
  const gitStatus = getGitStatus(node.name);

  return (
    <div className="min-w-0 font-sans">
      <div 
        onClick={() => isFolder ? setIsOpen(!isOpen) : onFileSelect(node.path)}
        className="group flex items-center justify-between h-[22px] pr-3 hover:bg-[#2a2d32] text-[#cccccc] hover:text-white cursor-pointer transition-colors"
        style={{ paddingLeft: `${depth * 10 + 12}px` }}
      >
        <div className="flex items-center overflow-hidden">
          <span className="w-5 h-5 flex items-center justify-center shrink-0 text-[#cccccc]">
            {isFolder ? (isOpen ? <ChevronDown /> : <ChevronRight />) : <span className="w-4 h-4" />}
          </span>

          {!isFolder && (
            <div className="mr-[6px] shrink-0">
              {getFileIcon(node.name)}
            </div>
          )}

          <span className={`text-[13px] truncate ${gitStatus ? gitStatus.color : ''}`}>
            {node.name}
          </span>
        </div>

        {gitStatus && !isFolder && (
          <span className={`text-[10px] font-semibold shrink-0 ml-2 ${gitStatus.color}`}>
            {gitStatus.text}
          </span>
        )}
        {gitStatus && isFolder && (
          <span className={`w-2 h-2 rounded-full shrink-0 ml-2 bg-current ${gitStatus.color}`} />
        )}
      </div>
      
      {isOpen && node.children?.map(c => (
        <FileTreeRender key={c.path} node={c} onFileSelect={onFileSelect} depth={depth + 1} />
      ))}
    </div>
  );
}