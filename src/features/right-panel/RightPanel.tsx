import React from 'react';

interface RightPanelProps {
  activeMenu: 'tests' | 'constraints';
  setActiveMenu: (menu: 'tests' | 'constraints') => void;
}

export function RightPanel({ activeMenu, setActiveMenu }: RightPanelProps) {
  return (
    <div className="w-64 bg-[#0d1117] border-l border-[#21262d] flex flex-col text-sm">
      <div className="flex border-b border-[#21262d] text-xs">
        <button 
          onClick={() => setActiveMenu('tests')}
          className={`flex-1 py-2 text-center font-bold ${activeMenu === 'tests' ? 'text-white border-b-2 border-blue-500' : 'text-[#8b949e]'}`}
        >
          Tests [R] <span className="bg-[#21262d] px-1 text-[10px] rounded text-orange-400">S</span>
        </button>
        <button 
          onClick={() => setActiveMenu('constraints')}
          className={`flex-1 py-2 text-center font-bold ${activeMenu === 'constraints' ? 'text-white border-b-2 border-blue-500' : 'text-[#8b949e]'}`}
        >
          Constraints [R]
        </button>
      </div>
      <div className="p-3 flex-1 overflow-y-auto space-y-2 text-xs">
        {activeMenu === 'tests' ? (
          <div>
            <div className="text-[#8b949e] mb-2 font-semibold">Test Case Execution:</div>
            <div className="bg-[#161b22] p-2 border border-[#21262d] rounded text-emerald-400 mb-1">✓ Test Case 1 (0.02s)</div>
            <div className="bg-[#161b22] p-2 border border-[#21262d] rounded text-emerald-400">✓ Test Case 2 (0.01s)</div>
          </div>
        ) : (
          <div className="text-[#8b949e]">Constraints Configuration Area [TBC]</div>
        )}
      </div>
    </div>
  );
}