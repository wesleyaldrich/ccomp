import React, { useState, useEffect, useRef, useMemo } from 'react';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { FileNode } from '../../core/types';

interface SidebarProps {
  activeMenu: 'explorer' | 'search' | 'settings' | string | null;
  fileSystem: FileNode[];
  onFileSelect: (path: string, match?: { line: number, column: number, endColumn: number }) => void;
  onImportWorkspace?: () => void;
  onCloseWorkspace?: () => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (val: boolean) => void;
  onCreateNewFile?: () => void;
  onSaveAll?: () => void;
}

// --- Format Tanggal ---
const getFormattedDate = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy}_${hh}-${min}-${ss}`;
};

// --- Icon SVG ---
const AddFileIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 2L14 5.5V14H2V2h8.5zm-.5 1H3v10h10V6.5H9.5V3zM10 3.5V6h2.5L10 3.5z"/><path d="M7 8h2v2h2v1H9v2H7v-2H5v-1h2V8z"/></svg>;
const CollapseIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14 1H2v2h12V1zM2 13h12v2H2v-2zm2-4h8v2H4V9z"/></svg>;
const ChevronRight = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 4L10 8L6 12" /></svg>;
const ChevronDown = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6L8 10L12 6" /></svg>;

// --- Icon SVG Search ---
const ClearIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 6.586l3.5-3.5 1.414 1.414-3.5 3.5 3.5 3.5-1.414 1.414-3.5-3.5-3.5 3.5-1.414-1.414 3.5-3.5-3.5-3.5L4.5 3.086 8 6.586z"/></svg>;
const ReplaceIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3h12v2H1V3zm0 4h9v2H1V7zm0 4h6v2H1v-2zm12-4.5l3 3-3 3v-2H9v-2h4v-2z"/></svg>;
const ReplaceAllIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M14 3v2h-4V3h4zM1 3h7v2H1V3zm0 4h13v2H1V7zm0 4h13v2H1v-2z"/></svg>;
const EllipsisIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>;
const BookIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M13 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm0 11H3V3h10v10z"/><path d="M4 4h8v2H4z"/></svg>;
const GearIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1.5v2h3v-2h-3zm-2.5.5h-2v12h12v-12h-2v2.5h-8v-2.5zM2 1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm8 8.5a2 2 0 1 0-4 0 2 2 0 0 0 4 0z"/></svg>;
const RefreshIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M12.5 4l-1.5 1.5A4.5 4.5 0 1 0 13.5 8h1A5.5 5.5 0 1 1 11 3.2L12.5 1.7V4z"/></svg>;

// --- Icon Desain Baru ---
const YellowFolderIcon = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="#e3b341"><path d="M14 4h-4.5L8 2H2v12h12V4zm-1 1v8H3V3h4.5l1.5 2H13z"/><path d="M2 14V2h5.5l1.5 2H14v10H2z"/></svg>;

const getFileIcon = (name: string) => {
  if (name.endsWith('.c') || name.endsWith('.cpp')) return <span className="text-[#3178c6] font-extrabold text-[13px] w-4 h-4 flex items-center justify-center shrink-0">C</span>;
  if (name.endsWith('.json')) return <span className="text-[#cbcb41] font-extrabold text-[12px] w-4 h-4 flex items-center justify-center shrink-0">{`{}`}</span>;
  if (name.endsWith('.in') || name.endsWith('.out')) return <svg className="w-3.5 h-3.5 text-[#8b949e] shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M13 4.5l-3-3H3v13h10V4.5zM9.5 2.5L12 5H9.5V2.5zM4 13.5v-11h4.5V6H12v7.5H4z"/></svg>;
  return <svg className="w-3.5 h-3.5 text-[#8b949e] shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M13 4.5l-3-3H3v13h10V4.5zM9.5 2.5L12 5H9.5V2.5zM4 13.5v-11h4.5V6H12v7.5H4z"/></svg>;
};

// ============================================================================
// KOMPONEN TOOLTIP GLOBAL
// ============================================================================
function Tooltip({ text, position = 'bottom', align = 'center' }: { text: string, position?: 'top' | 'bottom', align?: 'center' | 'left' | 'right' }) {
  const isTop = position === 'top';

  const positioningStyle: React.CSSProperties = {
    position: 'absolute',
    top: isTop ? 'auto' : '100%',
    bottom: isTop ? '100%' : 'auto',
    marginTop: isTop ? '0' : '6px',
    marginBottom: isTop ? '6px' : '0',
    zIndex: 999999,
  };

  if (align === 'right') {
    positioningStyle.right = '0px';
    positioningStyle.left = 'auto';
    positioningStyle.transform = 'none';
  } else if (align === 'left') {
    positioningStyle.left = '0px';
    positioningStyle.right = 'auto';
    positioningStyle.transform = 'none';
  } else {
    positioningStyle.left = '50%';
    positioningStyle.right = 'auto';
    positioningStyle.transform = 'translateX(-50%)';
  }

  return (
    <div 
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 pointer-events-none whitespace-nowrap"
      style={{ 
        ...positioningStyle,
        backgroundColor: '#252526',
        border: '1px solid #454545', 
        color: '#cccccc', 
        padding: '4px 8px', 
        borderRadius: '4px', 
        fontSize: '12px', 
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        textTransform: 'capitalize'
      }}
    >
      {text}
    </div>
  );
}

export function Sidebar({ 
  activeMenu, 
  fileSystem, 
  onFileSelect, 
  onImportWorkspace, 
  onCloseWorkspace, 
  isMenuOpen, 
  setIsMenuOpen,
  onCreateNewFile,
  onSaveAll 
}: SidebarProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCtrlKPressed = false;
    let timeoutId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isCtrlKPressed = true;
        if (timeoutId) window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => { isCtrlKPressed = false; }, 2000);
        return;
      }

      if (isCtrlKPressed) {
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          if (onSaveAll) onSaveAll();
          else alert('All files saved!');
        } else if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          if (onCloseWorkspace) onCloseWorkspace();
        } else if (isCtrlOrCmd && e.key.toLowerCase() === 'o') {
          e.preventDefault();
          if (onImportWorkspace) onImportWorkspace();
        }
        isCtrlKPressed = false;
        window.clearTimeout(timeoutId);
        return;
      }

      if (isCtrlOrCmd && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (onCreateNewFile) onCreateNewFile();
        else onFileSelect(`/workspace/Untitled-${getFormattedDate()}.cpp`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [onCreateNewFile, onSaveAll, onCloseWorkspace, onImportWorkspace, onFileSelect]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, setIsMenuOpen]);

  if (!activeMenu) return null;

  return (
    <div className="w-full h-full flex flex-col font-sans select-none bg-[#111418] text-[#cccccc] min-w-0 overflow-visible relative z-[9999]">
      
      {/* ---------------- EXPLORER MENU ---------------- */}
      {activeMenu === 'explorer' && (
        <>
          <div className="flex justify-between items-center text-[11px] text-[#cccccc] tracking-wider font-semibold relative z-50" style={{ marginTop: '6px', marginBottom: '2px', paddingLeft: '24px', paddingRight: '16px' }}>
            <span>EXPLORER</span>
            <div ref={menuRef} className="relative z-50" style={{ position: 'relative' }}>
              <div onClick={() => setIsMenuOpen(!isMenuOpen)} className={`cursor-pointer p-[2px] rounded transition-colors ${isMenuOpen ? 'bg-[#2a2d32] text-white' : 'hover:bg-[#2a2d32] text-[#cccccc] hover:text-white'}`}>
                <EllipsisIcon />
              </div>
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 min-w-[260px] bg-[#252526] border border-[#454545] shadow-2xl z-50 normal-case tracking-normal font-normal" style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}>
                  
                  <MenuItem 
                    label="New File" 
                    shortcut="Ctrl+N" 
                    onClick={() => { 
                      setIsMenuOpen(false); 
                      if (onCreateNewFile) onCreateNewFile();
                      else onFileSelect(`/workspace/Untitled-${getFormattedDate()}.cpp`);
                    }} 
                  />
                  <MenuDivider />
                  
                  <MenuItem 
                    label="Open Folder" 
                    shortcut="Ctrl+K Ctrl+O" 
                    onClick={() => { 
                      setIsMenuOpen(false); 
                      if (onImportWorkspace) onImportWorkspace(); 
                    }} 
                  />
                  <MenuDivider />
                  
                  <MenuItem 
                    label="Save All" 
                    shortcut="Ctrl+K S" 
                    onClick={() => { 
                      setIsMenuOpen(false); 
                      if (onSaveAll) onSaveAll();
                      else alert('All files saved!'); 
                    }} 
                  />
                  <MenuDivider />
                  
                  <MenuItem 
                    label="Close Folder" 
                    shortcut="Ctrl+K F" 
                    onClick={() => { 
                      setIsMenuOpen(false); 
                      if (onCloseWorkspace) onCloseWorkspace(); 
                    }} 
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 w-full relative z-40">
            {fileSystem.length === 0 ? (
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar" style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '4px' }}>
                <span className="text-[13px] text-[#cccccc] mb-[5px]">You have not yet opened a folder.</span>
                <button 
                  onClick={onImportWorkspace} className="w-full text-white !text-white text-[13px] py-[6px] hover:brightness-110 transition-all cursor-pointer" 
                  style={{ backgroundColor: '#0f3bb6', borderRadius: '5px', border: 'none', color: 'white' }}
                >
                  Open Folder
                </button>
              </div>
            ) : (
              fileSystem.map((node, idx) => (
                <RootFolderRender 
                  key={node.path || idx} 
                  node={node} 
                  onFileSelect={onFileSelect} 
                  onCreateNewFile={onCreateNewFile} 
                />
              ))
            )}
          </div>
        </>
      )}

      {/* ---------------- SEARCH MENU ---------------- */}
      {activeMenu === 'search' && (
        <SearchPanel fileSystem={fileSystem} onFileSelect={onFileSelect} />
      )}

    </div>
  );
}

// ============================================================================
// KOMPONEN SEARCH PANEL & LOGIC
// ============================================================================

function SearchPanel({ fileSystem, onFileSelect }: { fileSystem: FileNode[], onFileSelect: (path: string, match?: { line: number, column: number, endColumn: number }) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [preserveCase, setPreserveCase] = useState(false);

  const [isReplaceOpen, setIsReplaceOpen] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [filesToInclude, setFilesToInclude] = useState('');
  const [filesToExclude, setFilesToExclude] = useState('');
  const [isIncludeFocused, setIsIncludeFocused] = useState(false);
  const [isExcludeFocused, setIsExcludeFocused] = useState(false);

  const [refreshVersion, setRefreshVersion] = useState(0);
  const [collapseVersion, setCollapseVersion] = useState(0);

  const handleClearAllFields = () => {
    setSearchQuery('');
    setReplaceQuery('');
    setFilesToInclude('');
    setFilesToExclude('');
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const results: { file: FileNode; matches: { lineNum: number; text: string; matchStart: number; matchEnd: number }[] }[] = [];
    
    let regex: RegExp;
    try {
      let flags = 'g';
      if (!matchCase) flags += 'i';
      let pattern = searchQuery;
      if (!useRegex) pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) pattern = `\\b${pattern}\\b`;
      regex = new RegExp(pattern, flags);
    } catch (e) {
      return []; 
    }

    const searchNode = (node: FileNode) => {
      if (node.type === 'file') {
        const pathMatchInclude = filesToInclude ? node.path.includes(filesToInclude.replace(/\*/g, '')) : true;
        const pathMatchExclude = filesToExclude ? !node.path.includes(filesToExclude.replace(/\*/g, '')) : true;
        
        if (pathMatchInclude && pathMatchExclude && node.content) {
          const lines = node.content.split('\n');
          const matches: any[] = [];
          
          lines.forEach((line, idx) => {
            regex.lastIndex = 0;
            const match = regex.exec(line);
            if (match) {
              matches.push({
                lineNum: idx + 1,
                text: line, 
                matchStart: match.index,
                matchEnd: match.index + match[0].length
              });
            }
          });
          if (matches.length > 0) results.push({ file: node, matches });
        }
      }
      if (node.children) node.children.forEach(searchNode);
    };

    fileSystem.forEach(searchNode);
    return results;
  }, [searchQuery, matchCase, wholeWord, useRegex, fileSystem, filesToInclude, filesToExclude, refreshVersion]);

  const handleReplaceAll = async () => {
    if (!replaceQuery && !window.confirm("Replace query is empty. Proceed to delete matches?")) return;
    
    let successCount = 0;
    for (const result of searchResults) {
      try {
        const content = await readTextFile(result.file.path);
        let flags = 'g';
        if (!matchCase) flags += 'i';
        let pattern = searchQuery;
        if (!useRegex) pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (wholeWord) pattern = `\\b${pattern}\\b`;
        
        const regex = new RegExp(pattern, flags);
        const newContent = content.replace(regex, replaceQuery);
        
        await writeTextFile(result.file.path, newContent);
        successCount++;
      } catch (e) {
        console.warn("Mungkin ini file MOCK. Tidak dapat melakukan Replace fisik.");
      }
    }
    
    if (successCount === 0) {
      alert("Operasi Replace hanya akan tersimpan secara permanen pada folder yang di-import dari sistem operasi asli Anda!");
    } else {
      setRefreshVersion(p => p + 1);
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative z-[9999] overflow-visible">
      
      {/* --- Search Header --- */}
      <div className="flex justify-between items-center text-[11px] text-[#cccccc] tracking-wider font-semibold relative z-50" style={{ padding: '12px 16px 8px 20px' }}>
        <span>SEARCH</span>
        <div className="flex items-center" style={{ gap: '12px' }}>
          
          <div className="relative group flex items-center justify-center cursor-pointer text-[#8b949e] hover:text-white transition-colors" style={{ position: 'relative' }}>
            <RefreshIcon />
            <Tooltip text="Refresh" position="bottom" align="center" />
          </div>
          
          <div className="relative group flex items-center justify-center cursor-pointer text-[#8b949e] hover:text-white transition-colors" style={{ position: 'relative' }}>
            <ClearIcon />
            <Tooltip text="Clear Search Results" position="bottom" align="center" />
          </div>
          
          <div className="relative group flex items-center justify-center cursor-pointer text-[#8b949e] hover:text-white transition-colors" style={{ position: 'relative' }}>
            <CollapseIcon />
            <Tooltip text="Collapse All" position="bottom" align="right" />
          </div>

        </div>
      </div>

      <div style={{ paddingRight: '16px' }} className="flex flex-col gap-[4px] relative overflow-visible">
        
        <div className="flex items-start w-full relative z-30 hover:z-50">
          <div 
            className="w-[28px] h-[24px] flex items-center justify-center cursor-pointer shrink-0 transition-transform text-[#cccccc] hover:text-white"
            onClick={() => setIsReplaceOpen(!isReplaceOpen)}
          >
            {isReplaceOpen ? <ChevronDown /> : <ChevronRight />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center h-[24px] bg-[#1c212b] border border-[#30363d] focus-within:border-[#007fd4] rounded-[2px] transition-colors overflow-visible">
              <input 
                type="text" 
                placeholder="Search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 w-full h-full bg-transparent border-none outline-none shadow-none text-[#cccccc] text-[13px] px-[6px] placeholder-[#8b949e]"
              />
              <div className="flex items-center gap-[1px] pr-[2px] shrink-0 bg-[#1c212b]">
                <SearchToggle label={<span className="font-medium">Aa</span>} active={matchCase} onClick={() => setMatchCase(!matchCase)} tooltip="Match Case" />
                <SearchToggle label={<span className="font-medium underline decoration-1 underline-offset-[2px]">ab</span>} active={wholeWord} onClick={() => setWholeWord(!wholeWord)} tooltip="Match Whole Word" />
                <SearchToggle label={<span className="font-medium">.*</span>} active={useRegex} onClick={() => setUseRegex(!useRegex)} tooltip="Use Regular Expression" />
              </div>
            </div>
          </div>
        </div>

        {isReplaceOpen && (
          <div className="flex items-start w-full relative z-20 hover:z-50">
            <div className="w-[28px] shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center h-[24px] bg-[#1c212b] border border-[#30363d] focus-within:border-[#007fd4] rounded-[2px] transition-colors overflow-visible">
                <input 
                  type="text" 
                  placeholder="Replace" 
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  className="flex-1 min-w-0 w-full h-full bg-transparent border-none outline-none shadow-none ring-0 text-[#cccccc] text-[13px] px-[6px] placeholder-[#8b949e]"
                />
                <div className="flex items-center gap-[1px] pr-[2px] shrink-0 bg-[#1c212b]">
                  <SearchToggle label={<span className="font-medium">AB</span>} active={preserveCase} onClick={() => setPreserveCase(!preserveCase)} tooltip="Preserve Case" />
                  <ActionIcon icon={<ReplaceIcon />} onClick={() => alert("Gunakan icon Replace All di sebelahnya untuk fungsionalitas penuh.")} tooltip="Replace" />
                  <ActionIcon icon={<ReplaceAllIcon />} onClick={handleReplaceAll} tooltip="Replace All" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start w-full relative z-10 hover:z-50">
          <div className="w-[28px] shrink-0"></div>
          <div className="flex-1 flex justify-end min-w-0">
            <div 
              className="relative group cursor-pointer text-[#cccccc] hover:text-white p-[2px] rounded hover:bg-[#3d4145] transition-colors"
              style={{ position: 'relative' }}
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            >
              <EllipsisIcon />
              <Tooltip text="Toggle Search Details" position="bottom" align="right" />
            </div>
          </div>
        </div>

        {isDetailsOpen && (
          <div className="flex items-start w-full mb-2 relative z-0 hover:z-50">
            <div className="w-[28px] shrink-0"></div>
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              
              <div className="flex flex-col gap-[2px] min-w-0 w-full">
                <span className="text-[11px] text-[#cccccc] leading-tight">files to include</span>
                <div className="flex items-center h-[24px] bg-[#1c212b] border border-[#30363d] focus-within:border-[#007fd4] rounded-[2px] transition-colors overflow-visible">
                  <input 
                    type="text" 
                    placeholder={isIncludeFocused ? "e.g. *.ts, src/**/include" : ""}
                    onFocus={() => setIsIncludeFocused(true)}
                    onBlur={() => setIsIncludeFocused(false)}
                    value={filesToInclude}
                    onChange={(e) => setFilesToInclude(e.target.value)}
                    className="flex-1 min-w-0 w-full h-full bg-transparent border-none outline-none shadow-none ring-0 text-[#cccccc] text-[13px] px-[6px] placeholder-[#6e7681]"
                  />
                  <div className="relative group flex items-center justify-center w-[22px] shrink-0 cursor-pointer text-[#8b949e] hover:text-[#cccccc]" style={{ position: 'relative' }}>
                    <BookIcon />
                    <Tooltip text="Search only in Open Editors" position="bottom" align="right" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-[2px] min-w-0 w-full">
                <span className="text-[11px] text-[#cccccc] leading-tight">files to exclude</span>
                <div className="flex items-center h-[24px] bg-[#1c212b] border border-[#30363d] focus-within:border-[#007fd4] rounded-[2px] transition-colors overflow-visible">
                  <input 
                    type="text" 
                    placeholder={isExcludeFocused ? "e.g. *.ts, src/**/include" : ""}
                    onFocus={() => setIsExcludeFocused(true)}
                    onBlur={() => setIsExcludeFocused(false)}
                    value={filesToExclude}
                    onChange={(e) => setFilesToExclude(e.target.value)}
                    className="flex-1 min-w-0 w-full h-full bg-transparent border-none outline-none shadow-none ring-0 text-[#cccccc] text-[13px] px-[6px] placeholder-[#6e7681]"
                  />
                  <div className="relative group flex items-center justify-center w-[22px] shrink-0 cursor-pointer text-[#8b949e] hover:text-[#cccccc]" style={{ position: 'relative' }}>
                    <GearIcon />
                    <Tooltip text="Use Exclude Settings and Ignore Files" position="bottom" align="right" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar mt-2" style={{ paddingRight: '16px' }}>
        {searchResults.map((result, i) => (
          <SearchResultNode key={i} result={result} onFileSelect={onFileSelect} collapseVersion={collapseVersion} />
        ))}
      </div>
    </div>
  );
}

function SearchToggle({ label, active, onClick, tooltip }: { label: React.ReactNode, active: boolean, onClick: () => void, tooltip: string }) {
  return (
    <div className="relative group flex items-center justify-center z-[9999]" style={{ position: 'relative' }}>
      <div 
        onClick={onClick}
        style={{ width: '20px', height: '20px', fontSize: '12px' }}
        className={`flex items-center justify-center rounded-[3px] cursor-pointer font-mono transition-colors shrink-0 ${
          active ? 'bg-[#007fd4] text-white' : 'text-[#8b949e] hover:text-[#cccccc] hover:bg-[#30363d]'
        }`}
      >
        {label}
      </div>
      <Tooltip text={tooltip} position="bottom" align="center" />
    </div>
  );
}

function ActionIcon({ icon, onClick, tooltip }: { icon: React.ReactNode, onClick: () => void, tooltip: string }) {
  return (
    <div className="relative group flex items-center justify-center z-[9999]" style={{ position: 'relative' }}>
      <div 
        onClick={onClick}
        style={{ width: '20px', height: '20px' }}
        className="flex items-center justify-center cursor-pointer text-[#8b949e] hover:text-[#cccccc] hover:bg-[#30363d] transition-colors rounded-[3px] shrink-0"
      >
        {icon}
      </div>
      <Tooltip text={tooltip} position="bottom" align="center" />
    </div>
  );
}

function SearchResultNode({ result, onFileSelect, collapseVersion }: { result: any, onFileSelect: (path: string, match?: { line: number, column: number, endColumn: number }) => void, collapseVersion: number }) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (collapseVersion > 0) setIsOpen(false);
  }, [collapseVersion]);

  const file = result.file;
  const pathParts = file.path.split('/');
  const parentFolder = pathParts.length > 2 ? pathParts[pathParts.length - 2] : '';

  return (
    <div className="flex flex-col min-w-0">
      <div 
        className="group flex items-center justify-between cursor-pointer hover:bg-[#2a2d32] transition-colors"
        style={{ padding: '2px 0 2px 4px', height: '22px' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-[4px] overflow-hidden min-w-0">
          <span className="w-4 h-4 flex items-center justify-center shrink-0 text-[#cccccc] transition-transform">
            {isOpen ? <ChevronDown /> : <ChevronRight />}
          </span>
          <span className="flex items-center justify-center w-4 h-4 shrink-0">
            {file.name.includes('.') ? getFileIcon(file.name) : <YellowFolderIcon />}
          </span>
          <span className="text-[13px] text-[#cccccc] truncate min-w-0">{file.name}</span>
          <span className="text-[12px] text-[#6e7681] truncate min-w-0 ml-[4px]">{parentFolder}</span>
        </div>
        <div className="bg-[#454545] text-[#cccccc] text-[11px] px-[6px] rounded-[10px] h-[16px] flex items-center font-bold shrink-0 ml-2">
          {result.matches.length}
        </div>
      </div>

      {isOpen && result.matches.map((match: any, idx: number) => {
        const textBefore = match.text.substring(0, match.matchStart);
        const textMatched = match.text.substring(match.matchStart, match.matchEnd);
        const textAfter = match.text.substring(match.matchEnd);

        return (
          <div 
            key={idx}
            className="cursor-pointer hover:bg-[#2a2d32] transition-colors flex items-center gap-[8px]"
            style={{ padding: '2px 0 2px 28px', fontSize: '13px', color: '#cccccc', height: '22px' }}
            onClick={() => onFileSelect(file.path, { 
              line: match.lineNum, 
              column: match.matchStart + 1, 
              endColumn: match.matchEnd + 1 
            })}
          >
            <span style={{ color: '#6e7681', minWidth: '16px', textAlign: 'right', flexShrink: 0 }}>{match.lineNum}:</span>
            
            <span className="flex-1 min-w-0 truncate">
              {textBefore.trimStart()}
              <span style={{ backgroundColor: '#204060', color: '#ffffff', borderRadius: '2px' }}>{textMatched}</span>
              {textAfter}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// KOMPONEN RENDER EXPLORER
// ============================================================================

function MenuItem({ label, shortcut, onClick }: { label: string, shortcut?: string, onClick: () => void }) {
  return (
    <div onClick={(e) => { e.stopPropagation(); onClick(); }} className="flex justify-between items-center hover:bg-[#04395e] hover:text-white cursor-pointer text-[13px] text-[#cccccc] transition-colors whitespace-nowrap group" style={{ paddingRight: '20px', paddingTop: '6px', paddingBottom: '6px' }}>
      <div className="flex items-center min-w-0"><div style={{ width: '24px' }} className="shrink-0 flex items-center justify-center" /><span className="truncate">{label}</span></div>
      <div className="text-right shrink-0">{shortcut && <span className="text-[#858585] group-hover:text-[#b0b0b0] text-[12px] ml-4">{shortcut}</span>}</div>
    </div>
  );
}
function MenuDivider() { return <div className="h-px bg-[#454545]" style={{ marginTop: '4px', marginBottom: '4px', marginLeft: '12px', marginRight: '12px' }} />; }

function RootFolderRender({ node, onFileSelect, onCreateNewFile }: { node: FileNode; onFileSelect: (path: string) => void; onCreateNewFile?: () => void }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex flex-col mb-1 min-w-0 flex-1 relative z-[9999]">
      
      <div 
        className="flex items-center justify-between h-[24px] cursor-pointer hover:bg-[#2a2d32] transition-colors font-semibold text-[#cccccc] min-w-0 relative z-[9999]" 
        style={{ paddingLeft: '4px', paddingRight: '8px' }} 
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-[4px] overflow-hidden min-w-0">
          <span className="w-4 h-4 flex items-center justify-center shrink-0 transition-transform">{isOpen ? <ChevronDown /> : <ChevronRight />}</span>
          <span className="w-4 h-4 flex items-center justify-center shrink-0"><YellowFolderIcon /></span>
          <span className="text-[13px] tracking-wide truncate min-w-0">{node.name}</span>
        </div>
        
        <div 
          className="flex items-center transition-opacity gap-[2px] shrink-0" 
          style={{ opacity: isHovered ? 1 : 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="group flex items-center justify-center" style={{ position: 'relative' }}>
            <div 
              className="p-1 hover:bg-[#3d4145] rounded text-[#cccccc] hover:text-white transition-colors cursor-pointer flex items-center justify-center" 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (onCreateNewFile) onCreateNewFile(); 
                else onFileSelect(`/workspace/Untitled-${getFormattedDate()}.cpp`); 
              }}
            >
              <AddFileIcon />
            </div>
            <Tooltip text="New File" position="bottom" align="center" />
          </div>
          
          <div className="group flex items-center justify-center" style={{ position: 'relative' }}>
            <div 
              className="p-1 hover:bg-[#3d4145] rounded text-[#cccccc] hover:text-white transition-colors cursor-pointer flex items-center justify-center" 
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsOpen(false); 
              }}
            >
              <CollapseIcon />
            </div>
            <Tooltip text="Collapse Folders" position="bottom" align="center" />
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar pb-4 relative z-10 w-full">
          {node.children?.map(c => <FileTreeRender key={c.path} node={c} onFileSelect={onFileSelect} depth={1} />)}
        </div>
      )}
      
    </div>
  );
}

function FileTreeRender({ node, onFileSelect, depth }: { node: FileNode; onFileSelect: (path: string) => void; depth: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.type === 'folder';

  return (
    <div className="flex flex-col min-w-0">
      <div 
        className="flex items-center h-[22px] cursor-pointer hover:bg-[#2a2d32] transition-colors text-[#cccccc] min-w-0" 
        style={{ paddingLeft: `${depth * 12 + 4}px`, paddingRight: '8px' }}
        onClick={() => isFolder ? setIsOpen(!isOpen) : onFileSelect(node.path)}
      >
        <div className="flex items-center gap-[4px] overflow-hidden min-w-0 w-full">
          <span className={`w-4 h-4 flex items-center justify-center shrink-0 transition-transform ${!isFolder ? 'invisible' : ''}`}>
            {isOpen ? <ChevronDown /> : <ChevronRight />}
          </span>
          <span className="w-4 h-4 flex items-center justify-center shrink-0">
            {isFolder ? <YellowFolderIcon /> : getFileIcon(node.name)}
          </span>
          <span className="text-[13px] tracking-wide truncate min-w-0">{node.name}</span>
        </div>
      </div>
      
      {isFolder && isOpen && node.children?.map(c => (
        <FileTreeRender key={c.path} node={c} onFileSelect={onFileSelect} depth={depth + 1} />
      ))}
    </div>
  );
}