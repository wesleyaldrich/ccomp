// src/App.tsx
import React, { useState } from 'react';
import { ActivityBar } from './features/activity-bar/ActivityBar';
import { Sidebar } from './features/sidebar/Sidebar';
import { MainEditor } from './features/main-editor/MainEditor';
import { RightPanel } from './features/right-panel/RightPanel';
import { BottomPanel } from './features/bottom-panel/BottomPanel';
import { FileNode } from './core/types';

// Mock Data berdasarkan gambar workspace CComp IDE Anda
const mockFileSystem: FileNode[] = [
  {
    name: 'workspace',
    type: 'folder',
    path: '/workspace',
    children: [
      { name: 'main.cpp', type: 'file', path: '/workspace/main.cpp', language: 'cpp', content: `// Validasi cuma boleh input angka di harga rumah\nonHargaRumahChange(event: any) {\n  const rawValue = event.target.value;\n  const nilai = rawValue.replace(/[^0-9]/g, '');\n  this.hargaRumah = parseInt(nilai, 10) || 0;\n}` },
      { name: 'brute.cpp', type: 'file', path: '/workspace/brute.cpp', language: 'cpp', content: '// Brute force approach' },
      { name: 'generator.cpp', type: 'file', path: '/workspace/generator.cpp', language: 'cpp', content: '// Testcase generator' },
      {
        name: 'tests',
        type: 'folder',
        path: '/workspace/tests',
        children: [
          { name: 'sample.in', type: 'file', path: '/workspace/tests/sample.in' },
          { name: 'sample.out', type: 'file', path: '/workspace/tests/sample.out' },
          { name: 'test_1.in', type: 'file', path: '/workspace/tests/test_1.in' },
        ]
      }
    ]
  }
];

export default function App() {
  const [activeLeftMenu, setActiveLeftMenu] = useState<'explorer' | 'settings' | null>('explorer');
  const [activeRightMenu, setActiveRightMenu] = useState<'tests' | 'constraints' | null>('tests');
  const [activeBottomMenu, setActiveBottomMenu] = useState<'analysis' | 'test-output' | 'terminal' | null>('terminal');
  
  const [openTabs, setOpenTabs] = useState<string[]>(['/workspace/main.cpp']);
  const [activeTab, setActiveTab] = useState<string | null>('/workspace/main.cpp');

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1117] text-[#c9d1d9] font-sans overflow-hidden select-none">
      {/* Top Header Mock Bar */}
      <div className="h-10 border-b border-[#21262d] flex items-center justify-between px-4 bg-[#161b22]">
        <div className="flex items-center space-x-2 text-sm font-semibold text-[#f0f6fc]">
          <span className="text-blue-500">C</span> CComp IDE
        </div>
        <div className="text-xs text-[#8b949e]">workspace - CComp IDE</div>
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Leftmost Activity Bar */}
        <ActivityBar activeMenu={activeLeftMenu} setActiveMenu={setActiveLeftMenu} />

        {/* Collapsible Left Sidebar */}
        {activeLeftMenu && (
          <Sidebar activeMenu={activeLeftMenu} fileSystem={mockFileSystem} onFileSelect={(path) => {
            if (!openTabs.includes(path)) setOpenTabs([...openTabs, path]);
            setActiveTab(path);
          }} />
        )}

        {/* Center Workspace Area */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-[#21262d]">
          <div className="flex-1 flex overflow-hidden">
            
            {/* Real Code Editor Frame */}
            <MainEditor 
              openTabs={openTabs} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              setOpenTabs={setOpenTabs}
              mockFileSystem={mockFileSystem}
            />

            {/* Right Context Panel (Tests / Constraints) */}
            {activeRightMenu && (
              <RightPanel activeMenu={activeRightMenu} setActiveMenu={setActiveRightMenu} />
            )}
          </div>

          {/* Bottom Panel (Terminal / Issues) */}
          {activeBottomMenu && (
            <BottomPanel activeMenu={activeBottomMenu} setActiveMenu={setActiveBottomMenu} />
          )}
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="h-6 bg-[#0d1117] border-t border-[#21262d] flex items-center justify-between px-3 text-xs text-[#8b949e]">
        <div className="flex items-center space-x-3">
          <span className="bg-[#1f6feb] text-white px-1.5 py-0.5 rounded text-[10px]">quma-core</span>
          <span>src &gt; main &gt; java &gt; entity &gt; Session</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Ln 16, Col 8</span>
          <span>UTF-8</span>
          <span>4 spaces</span>
        </div>
      </div>
    </div>
  );
}