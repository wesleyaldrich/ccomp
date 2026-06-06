import React from 'react';

interface BottomPanelProps {
  activeMenu: 'analysis' | 'test-output' | 'terminal';
  setActiveMenu: (menu: 'analysis' | 'test-output' | 'terminal') => void;
}

export function BottomPanel({ activeMenu, setActiveMenu }: BottomPanelProps) {
  return (
    <div className="h-48 bg-[#0d1117] border-t border-[#21262d] flex flex-col text-sm">
      {/* Sub Header tabs for panel */}
      <div className="h-8 bg-[#161b22] border-b border-[#21262d] flex items-center px-2 space-x-4 text-xs font-semibold">
        <button 
          onClick={() => setActiveMenu('analysis')}
          className={`${activeMenu === 'analysis' ? 'text-white border-b-2 border-blue-500 h-full px-1' : 'text-[#8b949e]'}`}
        >
          Analysis (B) <span className="text-[10px] text-yellow-500">[M]</span>
        </button>
        <button 
          onClick={() => setActiveMenu('test-output')}
          className={`${activeMenu === 'test-output' ? 'text-white border-b-2 border-blue-500 h-full px-1' : 'text-[#8b949e]'}`}
        >
          Test Output (B)
        </button>
        <button 
          onClick={() => setActiveMenu('terminal')}
          className={`${activeMenu === 'terminal' ? 'text-white border-b-2 border-blue-500 h-full px-1' : 'text-[#8b949e]'}`}
        >
          Terminal
        </button>
      </div>

      {/* Panel Content Screen */}
      <div className="flex-1 p-3 font-mono text-xs overflow-y-auto bg-[#0d1117]">
        {activeMenu === 'analysis' && (
          <div className="space-y-1 text-gray-300">
            <div className="text-blue-400 font-bold">&gt; Time Complexity Estimation:</div>
            <div className="pl-2 text-yellow-400">Approximate Complexities: O(N log N) based on recursive sorting rules</div>
            <div className="text-red-400 font-bold mt-2">&gt; Issues (Violated Rules):</div>
            <div className="pl-2 text-red-300">- Line 24: Avoid using global loop indices [Rule #1 Violate - L]</div>
          </div>
        )}
        {activeMenu === 'test-output' && (
          <div className="text-gray-400">
            <span className="text-green-500">[PASS]</span> Test Case 1 Expected Output match with execution code dump.
          </div>
        )}
        {activeMenu === 'terminal' && (
          <div className="text-[#e6edf3]">
            <span className="text-emerald-400">user@ccomp-ide-tauri:~/workspace$</span> tauri dev <br/>
            <span className="text-[#8b949e]">Info: Compiling custom C++ engine assets via selected GCC rule guidelines...</span>
          </div>
        )}
      </div>
    </div>
  );
}