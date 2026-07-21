import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readDir, readTextFile } from '@tauri-apps/plugin-fs';

import { ActivityBar } from './features/activity-bar/ActivityBar';
import { Sidebar } from './features/sidebar/Sidebar';
import { MainEditor } from './features/main-editor/MainEditor';
import { RightPanel } from './features/right-panel/RightPanel';
import { RightActivityBar } from './features/right-panel/RightActivityBar'; 
import { BottomPanel } from './features/bottom-panel/BottomPanel';
import { SettingsModal } from './features/settings/SettingsModal';
import { FileNode } from './core/types';

export interface TestCaseData {
  id: number;
  input: string;
  expected: string;
  executedInput?: string;
  executedExpected?: string;
}

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

const INITIAL_TEST_CASES: TestCaseData[] = [
  { id: 1, input: "5\n1 2 3 4 5", expected: "15", executedInput: "5\n1 2 3 4 5", executedExpected: "15" },
  { id: 2, input: "5\n1 2 3 4 5", expected: "15", executedInput: "5\n1 2 3 4 5", executedExpected: "15" },
  { id: 3, input: "5\n1 2 3 4 5", expected: "15", executedInput: "5\n1 2 3 4 5", executedExpected: "15" },
  { id: 4, input: "5\n1 2 3 4 5", expected: "15", executedInput: "5\n1 2 3 4 5", executedExpected: "15" },
  { id: 5, input: "5\n1 2 3 4 5", expected: "15", executedInput: "5\n1 2 3 4 5", executedExpected: "15" },
];

export default function App() {
  const [activeLeftMenu, setActiveLeftMenu] = useState<string | null>('explorer');
  const [activeRightMenu, setActiveRightMenu] = useState<string | null>('tests');
  const [activeBottomMenu, setActiveBottomMenu] = useState<string | null>('terminal');
  
  const [openTabs, setOpenTabs] = useState<string[]>(['/workspace/main.cpp']);
  const [activeTab, setActiveTab] = useState<string | null>('/workspace/main.cpp');
  const [fileSystem, setFileSystem] = useState<FileNode[]>(mockFileSystem);
  
  // --- STATE UNTUK SIDEBAR KIRI ---
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isDragging, setIsDragging] = useState(false);
  const [isExplorerMenuOpen, setIsExplorerMenuOpen] = useState(false);

  // --- STATE UNTUK SIDEBAR KANAN  ---
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  const [isRightDragging, setIsRightDragging] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeMatch, setActiveMatch] = useState<{ line: number; column: number; endColumn: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const [testCases, setTestCases] = useState<TestCaseData[]>(INITIAL_TEST_CASES);
  const [activeTestCaseTab, setActiveTestCaseTab] = useState<number>(1);
  const [hasRunTests, setHasRunTests] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newWidth = e.clientX - 64; 
        if (newWidth >= 150 && newWidth <= 600) setSidebarWidth(newWidth);
      } else if (isRightDragging) {
        const newWidth = window.innerWidth - e.clientX - 48; 
        if (newWidth >= 250 && newWidth <= 800) setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsRightDragging(false);
      document.body.classList.remove('cursor-col-resize');
    };

    if (isDragging || isRightDragging) {
      document.body.classList.add('cursor-col-resize');
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.body.classList.remove('cursor-col-resize');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isRightDragging]);

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
          setZoomLevel((prev) => Math.min(prev + 0.1, 3));
        } else {
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

  const handleFileSelect = async (path: string, match?: { line: number, column: number, endColumn: number }) => {
    if (!openTabs.includes(path)) setOpenTabs([...openTabs, path]);
    setActiveTab(path);
    setActiveMatch(match || null);

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

  const handleMenuChange = (menu: string | null) => {
    if (menu === 'settings') {
      setIsSettingsOpen(true);
      return;
    }
    setActiveLeftMenu(menu);
  };

  const handleRunTest = (id?: number) => {
    setHasRunTests(true);
    setTestCases(prev => prev.map(tc => {
      if (id === undefined) {
        return { ...tc, executedInput: tc.input, executedExpected: tc.expected };
      } else if (tc.id === id) {
        return { ...tc, executedInput: tc.input, executedExpected: tc.expected };
      }
      return tc;
    }));

    if (id !== undefined) setActiveTestCaseTab(id);
    setActiveBottomMenu('test-output');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0d1117] relative">
      <div 
        className="flex flex-col text-[#c9d1d9] select-none"
        style={{ 
          width: `${100 / zoomLevel}%`, 
          height: `${100 / zoomLevel}%`, 
          transform: `scale(${zoomLevel})`, 
          transformOrigin: 'top left' 
        }}
      >
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

        <div className="flex flex-1 overflow-hidden relative">
          <ActivityBar 
            activeMenu={activeLeftMenu} 
            setActiveMenu={handleMenuChange} 
            isSettingsOpen={isSettingsOpen} 
            setIsSettingsOpen={setIsSettingsOpen}
            activeBottomMenu={activeBottomMenu}
            setActiveBottomMenu={setActiveBottomMenu}
          />

          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 flex overflow-hidden relative">
              
              {activeLeftMenu && (
                <div style={{ width: sidebarWidth }} className="shrink-0 h-full bg-[#161b22] border-r border-[#21262d] relative z-20">
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

              <div className={`flex-1 flex flex-col overflow-hidden bg-[#0d1117] ${isDragging || isRightDragging ? 'pointer-events-none' : ''}`}>
                <div className="flex-1 flex overflow-hidden">
                  
                  <MainEditor 
                    openTabs={openTabs} 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    setOpenTabs={setOpenTabs} 
                    mockFileSystem={fileSystem} 
                    activeMatch={activeMatch}
                    onCompile={() => alert("Sistem kompilasi sedang disiapkan!")}
                    onRunAll={() => handleRunTest()} 
                    onStop={() => alert("Eksekusi program dihentikan!")}
                  />
                  
                  {/* --- RIGHT PANEL RESIZER --- */}
                  {activeRightMenu && (
                    <div 
                      style={{ width: rightPanelWidth }} 
                      className="shrink-0 h-full bg-[#161b22] border-l border-[#21262d] relative z-20 flex flex-col"
                    >
                      <div 
                        className={`absolute top-0 left-0 h-full w-[4px] z-[9999] transition-colors duration-150 ease-in-out ${
                          isRightDragging ? 'bg-[#3574f0] cursor-col-resize' : 'hover:bg-[#3574f0] bg-transparent cursor-col-resize'
                        }`}
                        style={{ transform: 'translateX(-50%)' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIsRightDragging(true);
                        }}
                      />

                      <RightPanel 
                        activeMenu={activeRightMenu} 
                        setActiveMenu={setActiveRightMenu} 
                        onRunTest={handleRunTest}
                        testCases={testCases}
                        setTestCases={setTestCases}
                      />
                    </div>
                  )}
                  
                  <RightActivityBar activeMenu={activeRightMenu} setActiveMenu={setActiveRightMenu} />
                </div>
              </div>

              {activeLeftMenu && (
                <div 
                  className={`absolute top-0 h-full w-[4px] z-[9999] transition-colors duration-150 ease-in-out ${
                    isDragging ? 'bg-[#3574f0] cursor-col-resize' : 
                    isExplorerMenuOpen ? 'bg-transparent pointer-events-none' : 
                    'hover:bg-[#3574f0] bg-transparent cursor-col-resize'
                  }`}
                  style={{ left: `${sidebarWidth}px`, transform: 'translateX(-50%)' }}
                  onMouseDown={(e) => {
                    if (isExplorerMenuOpen) return;
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                />
              )}
            </div>

            {activeBottomMenu && (
              <BottomPanel 
                activeMenu={activeBottomMenu} 
                setActiveMenu={setActiveBottomMenu} 
                onOpenSettings={() => setIsSettingsOpen(true)}
                isSettingsOpen={isSettingsOpen} 
                testCases={testCases}
                setTestCases={setTestCases}
                activeTestCaseTab={activeTestCaseTab}
                setActiveTestCaseTab={setActiveTestCaseTab}
                hasRunTests={hasRunTests}
              />
            )}

          </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}