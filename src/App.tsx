import React, { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readDir, readTextFile } from '@tauri-apps/plugin-fs';

import { ActivityBar } from './features/activity-bar/ActivityBar';
import { Sidebar } from './features/sidebar/Sidebar';
import { MainEditor } from './features/main-editor/MainEditor';
import { RightPanel } from './features/right-panel/RightPanel';
import { BottomPanel } from './features/bottom-panel/BottomPanel';
import { FileNode } from './core/types';

const mockFileSystem: FileNode[] = [
  {
    name: 'workspace',
    type: 'folder',
    path: '/workspace',
    children: [
      { name: 'main.cpp', type: 'file', path: '/workspace/main.cpp', language: 'cpp', content: `// Validasi cuma boleh input angka di harga rumah\nonHargaRumahChange(event: any) {\n  const rawValue = event.target.value;\n  const nilai = rawValue.replace(/[^0-9]/g, '');\n  this.hargaRumah = parseInt(nilai, 10) || 0;\n}` },
      { name: 'brute.cpp', type: 'file', path: '/workspace/brute.cpp', language: 'cpp', content: '// Brute force approach' },
      { name: 'generator.cpp', type: 'file', path: '/workspace/generator.cpp', language: 'cpp', content: '// Testcase generator' }
    ]
  }
];

export default function App() {
  const [activeLeftMenu, setActiveLeftMenu] = useState<'explorer' | 'settings' | null>('explorer');
  const [activeRightMenu, setActiveRightMenu] = useState<'tests' | 'constraints' | null>('tests');
  const [activeBottomMenu, setActiveBottomMenu] = useState<'analysis' | 'test-output' | 'terminal' | null>('terminal');
  
  const [openTabs, setOpenTabs] = useState<string[]>(['/workspace/main.cpp']);
  const [activeTab, setActiveTab] = useState<string | null>('/workspace/main.cpp');
  const [fileSystem, setFileSystem] = useState<FileNode[]>(mockFileSystem);
  
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isDragging, setIsDragging] = useState(false);
  const [isExplorerMenuOpen, setIsExplorerMenuOpen] = useState(false);

  // --- Zoom ---
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = e.clientX - 64;
      if (newWidth >= 150 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.classList.remove('cursor-col-resize');
    };

    if (isDragging) {
      document.body.classList.add('cursor-col-resize');
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.body.classList.remove('cursor-col-resize');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Efek Zoom (Ctrl + Scroll / Ctrl + +/-)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoomLevel((prev) => Math.min(prev + 0.1, 3));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoomLevel(1);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          // Scroll Up -> Zoom In
          setZoomLevel((prev) => Math.min(prev + 0.1, 3));
        } else {
          // Scroll Down -> Zoom Out
          setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleImportWorkspace = async () => {
    try {
      const selectedPath = await open({ directory: true, multiple: false });
      if (selectedPath && typeof selectedPath === 'string') {
        const entries = await readDir(selectedPath);
        const newWorkspace: FileNode = {
          name: selectedPath.split(/[\\/]/).pop() || 'Workspace',
          path: selectedPath,
          type: 'folder',
          children: entries.map(e => ({ name: e.name, path: `${selectedPath}/${e.name}`, type: e.isDirectory ? 'folder' : 'file' }))
        };
        setFileSystem([newWorkspace]);
      }
    } catch (e) { console.error(e); }
  };

  const handleCloseWorkspace = () => {
    setFileSystem([]); 
    setOpenTabs([]);   
    setActiveTab(null);
  };

  const handleFileSelect = async (path: string) => {
    if (!openTabs.includes(path)) setOpenTabs([...openTabs, path]);
    setActiveTab(path);
    try {
      const content = await readTextFile(path);
      setFileSystem(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const update = (nodes: FileNode[]) => nodes.forEach(n => {
          if (n.path === path) n.content = content;
          if (n.children) update(n.children);
        });
        update(next);
        return next;
      });
    } catch (e) {}
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0d1117]">
      <div 
        className="flex flex-col text-[#c9d1d9] select-none"
        style={{ 
          width: `${100 / zoomLevel}%`, 
          height: `${100 / zoomLevel}%`, 
          transform: `scale(${zoomLevel})`, 
          transformOrigin: 'top left' 
        }}
      >
        {/* Header */}
        <div className="h-10 border-b border-[#21262d] flex items-center justify-between px-4 bg-[#161b22] shrink-0">
          <div className="flex items-center space-x-3 text-sm font-semibold text-[#f0f6fc]">
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                <img 
                  src="/src/assets/logo_ccomp.svg" 
                  alt="CComp Logo" 
                  style={{ width: '24px', height: '24px', display: 'block', objectFit: 'contain' }}
                  className="shrink-0"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            </div>
            <span>CComp IDE</span>
          </div>
        </div>

        {/* Main Container */}
        <div className="flex flex-1 overflow-hidden relative">
          <ActivityBar activeMenu={activeLeftMenu} setActiveMenu={setActiveLeftMenu} />

          {/* Sidebar Wrapper */}
          {activeLeftMenu && (
            <div 
              style={{ width: sidebarWidth }} 
              className="shrink-0 h-full bg-[#161b22] border-r border-[#21262d] relative z-20"
            >
              <Sidebar 
                activeMenu={activeLeftMenu} 
                fileSystem={fileSystem} 
                onFileSelect={handleFileSelect} 
                onImportWorkspace={handleImportWorkspace} 
                onCloseWorkspace={handleCloseWorkspace}
                isMenuOpen={isExplorerMenuOpen}
                setIsMenuOpen={setIsExplorerMenuOpen}
              />
            </div>
          )}

          {/* Editor Area */}
          <div className={`flex-1 flex flex-col overflow-hidden bg-[#0d1117] ${isDragging ? 'pointer-events-none' : ''}`}>
            <div className="flex-1 flex overflow-hidden">
              <MainEditor openTabs={openTabs} activeTab={activeTab} setActiveTab={setActiveTab} setOpenTabs={setOpenTabs} mockFileSystem={fileSystem} />
              {activeRightMenu && <RightPanel activeMenu={activeRightMenu} setActiveMenu={setActiveRightMenu} />}
            </div>
            {activeBottomMenu && <BottomPanel activeMenu={activeBottomMenu} setActiveMenu={setActiveBottomMenu} />}
          </div>

          {/* --- GARIS RESIZER --- */}
          {activeLeftMenu && (
            <div 
              className={`absolute top-0 h-full w-[6px] z-[9999] transition-colors duration-150 ease-in-out ${
                isDragging ? 'bg-[#007fd4] cursor-col-resize' : 
                isExplorerMenuOpen ? 'bg-transparent pointer-events-none' : 
                'hover:bg-[#007fd4] bg-transparent cursor-col-resize'
              }`}
              style={{ 
                left: `${64 + sidebarWidth - 3}px` 
              }}
              onMouseDown={(e) => {
                if (isExplorerMenuOpen) return;
                e.preventDefault();
                setIsDragging(true);
              }}
            />
          )}

        </div>
      </div>
    </div>
  );
}