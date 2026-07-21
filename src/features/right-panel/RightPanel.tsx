import { useState } from 'react';
import { TestCaseData } from '../../App'; 

interface RightPanelProps {
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
  onRunTest?: (id?: number) => void;
  testCases: TestCaseData[]; 
  setTestCases: (tcs: TestCaseData[]) => void; 
}

const MinimizeIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 7.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" /></svg>;
const PlayOutlineIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const CloseIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z" /></svg>;
const AddIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3a.5.5 0 0 1 .5.5v4h4a.5.5 0 0 1 0 1h-4v4a.5.5 0 0 1-1 0v-4h-4a.5.5 0 0 1 0-1h4v-4A.5.5 0 0 1 8 3z" /></svg>;

export function RightPanel({ activeMenu, setActiveMenu, onRunTest, testCases, setTestCases }: RightPanelProps) {
  const [focusedBox, setFocusedBox] = useState<string | null>(null);

  if (activeMenu !== 'tests') return null;

  return (
    <div className="w-full h-full bg-[#111418] flex flex-col shrink-0 font-sans z-10 relative">
      
      <style>{`
        .right-panel-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
        .right-panel-scroll::-webkit-scrollbar-track { background: transparent; }
        .right-panel-scroll::-webkit-scrollbar-thumb { background: #2b2d31; border: 3px solid #111418; border-radius: 6px; }
        .right-panel-scroll::-webkit-scrollbar-thumb:hover { background: #45484d; }
      `}</style>

      {/* --- HEADER --- */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #21262d", height: "42px", flexShrink: 0 }}>
        <div 
          className="flex items-center h-full text-[12px] text-[#8b949e] tracking-[0.1em] shrink-0"
          style={{ paddingLeft: "15px", paddingRight: "20px", paddingTop: "10px" }}
        >
          <span style={{ paddingBottom: "10px" }}>Test</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", color: "#8b949e", paddingRight: "8px" }}>
          <div style={{ cursor: "pointer", padding: "4px", borderRadius: "3px", transition: "background-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#2a2d32"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"} onClick={() => setActiveMenu(null)}><MinimizeIcon /></div>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        
        {/* Toolbar: Judul, Tombol Tambah (+), & Tombol Run All */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#c9d1d9", fontSize: "14px", fontWeight: 600 }}>Test Cases</span>
            {/* Tombol TAMBAH (+) */}
            <button
              onClick={() => {
                const newId = testCases.length > 0 ? Math.max(...testCases.map(t => t.id)) + 1 : 1;
                const newTCs = [...testCases, { id: newId, input: "", expected: "" }];
                setTestCases(newTCs);
              }}
              style={{
                color: "#cccccc",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                transition: "all 0.15s ease",
                opacity: 0.8
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#2a2d32";
                e.currentTarget.style.opacity = "1";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.opacity = "0.8";
              }}
              title="Add Test Case"
            >
              <AddIcon />
            </button>
          </div>
          <button 
            onClick={() => onRunTest?.()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(63, 185, 80, 0.1)', color: '#3fb950', border: '1px solid rgba(63, 185, 80, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(35, 134, 54, 0.1)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <PlayOutlineIcon /> Run All
          </button>
        </div>

        {/* List Test Cases */}
        <div className="right-panel-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 10px 20px 20px" }}>
          
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px", width: "100%" }}>
            <div style={{ width: "24px", flexShrink: 0 }}></div>
            <div style={{ flex: 1, color: "#8b949e", fontSize: "11px", fontWeight: 500 }}>Input</div>
            <div style={{ flex: 1, color: "#8b949e", fontSize: "11px", fontWeight: 500, marginLeft: "12px" }}>Expected Output</div>
            <div style={{ width: "56px", flexShrink: 0 }}></div> { /* Actions header */ }
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
            {testCases.map((tc, index) => (
              <div key={tc.id} style={{ display: "flex", alignItems: "center", width: "100%" }}>
                
                {/* Index */}
                <div style={{ width: "24px", color: "#cccccc", fontSize: "13px", fontWeight: 500, flexShrink: 0 }}>
                  {index + 1}
                </div>
                
                <div style={{ flex: 1, display: "flex", gap: "12px", minWidth: 0 }}>
                  
                  {/* Textbox Input */}
                  <div 
                    style={{ 
                      flex: 1, minWidth: 0, height: "60px", backgroundColor: "#161b22", borderRadius: "6px", overflow: "hidden", transition: "border-color 0.2s",
                      border: focusedBox === `in-${tc.id}` ? "1px solid #007fd4" : "1px solid #30363d",
                      padding: "8px 10px", boxSizing: "border-box"
                    }}
                  >
                    <textarea
                      value={tc.input}
                      onChange={(e) => {
                        const newTCs = [...testCases];
                        const idx = newTCs.findIndex(t => t.id === tc.id);
                        if(idx !== -1) {
                          newTCs[idx].input = e.target.value;
                          setTestCases(newTCs);
                        }
                      }}
                      onFocus={() => setFocusedBox(`in-${tc.id}`)}
                      onBlur={() => setFocusedBox(null)}
                      className="right-panel-scroll"
                      style={{ width: "100%", height: "100%", backgroundColor: "transparent", border: "none", outline: "none", color: "#c9d1d9", fontSize: "13px", fontFamily: "monospace", resize: "none", padding: "0px", margin: "0px", lineHeight: "1.4", boxSizing: "border-box", display: "block" }}
                      spellCheck={false}
                    />
                  </div>

                  {/* Textbox Expected Output */}
                  <div 
                    style={{ 
                      flex: 1, minWidth: 0, height: "60px", backgroundColor: "#161b22", borderRadius: "6px", overflow: "hidden", transition: "border-color 0.2s",
                      border: focusedBox === `out-${tc.id}` ? "1px solid #007fd4" : "1px solid #30363d",
                      padding: "8px 10px", boxSizing: "border-box"
                    }}
                  >
                    <textarea
                      value={tc.expected}
                      onChange={(e) => {
                        const newTCs = [...testCases];
                        const idx = newTCs.findIndex(t => t.id === tc.id);
                        if(idx !== -1) {
                          newTCs[idx].expected = e.target.value;
                          setTestCases(newTCs);
                        }
                      }}
                      onFocus={() => setFocusedBox(`out-${tc.id}`)}
                      onBlur={() => setFocusedBox(null)}
                      className="right-panel-scroll"
                      style={{ width: "100%", height: "100%", backgroundColor: "transparent", border: "none", outline: "none", color: "#c9d1d9", fontSize: "13px", fontFamily: "monospace", resize: "none", padding: "0px", margin: "0px", lineHeight: "1.4", boxSizing: "border-box", display: "block" }}
                      spellCheck={false}
                    />
                  </div>

                </div>
                
                <div style={{ width: "56px", display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end", flexShrink: 0 }}>
                  <button
                    onClick={() => {
                      const newTCs = testCases.filter(t => t.id !== tc.id);
                      setTestCases(newTCs);
                    }}
                    style={{
                      color: "#8b949e",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "4px",
                      transition: "all 0.1s ease",
                      opacity: 0.6
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = "#f85149";
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.backgroundColor = "rgba(248, 81, 73, 0.1)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = "#8b949e";
                      e.currentTarget.style.opacity = "0.6";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    title="Delete Test Case"
                  >
                    <CloseIcon />
                  </button>
                  <button 
                    onClick={() => onRunTest?.(tc.id)}
                    style={{ 
                      color: "#3fb950", 
                      background: "none", 
                      border: "none", 
                      cursor: "pointer", 
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "4px",
                      transition: "all 0.1s ease",
                      opacity: 0.6 
                    }} 
                    onMouseEnter={e => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.backgroundColor = "rgba(63, 185, 80, 0.1)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.opacity = "0.6";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    title="Run Test Case"
                  >
                    <PlayOutlineIcon />
                  </button>
                </div>
                
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}