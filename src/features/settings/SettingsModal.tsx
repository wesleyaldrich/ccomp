import { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Icons ---
const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5"></circle><path d="M10.5 10.5L14 14"></path></svg>;
const ChevronDown = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6L8 10L12 6" /></svg>;
const FolderIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h4l2 2h6v8H2V3z"/></svg>;
const CopyIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="8" height="8" rx="1"></rect><path d="M4 11H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"></path></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#3fb950" strokeWidth="2"><path d="M3.5 8.5l3 3 6-6"></path></svg>;
const CloseIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z"/></svg>;
const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2z"/></svg>;
const MoreVertIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM8 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM8 14a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>;
const InfoOutlineIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#58a6ff" strokeWidth="1.5"><circle cx="8" cy="8" r="6"></circle><path d="M8 11V7"></path><path d="M8 5h.01"></path></svg>;

const StarSolid = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="#3574f0"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const StarOutline = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="1.5" className="hover:stroke-[#dfdfdf] transition-colors"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;

// --- Compiler SVG Icons ---
const GCCIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#d29922" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="#d29922"/></svg>;
const ClangIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#1c212b" stroke="#8b949e" strokeWidth="1.5"/><path d="M15 7 A 6 6 0 1 0 15 17 A 7 7 0 1 1 15 7 Z" fill="#dfdfdf"/></svg>;
const WindowsIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="#3574f0"><path d="M3 4.5l8-1.2v8.5H3V4.5zm8.5-1.3L21 1.5v10.3h-9.5V3.2zm-8.5 9.8h8v8.5l-8-1.2v-7.3zm8.5 0H21v10.3l-9.5-1.4v-8.9z"/></svg>;
const CloudIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="1.5"><path d="M17.5 19H9a7 7 0 1 1 6.71-4.71c.28-.02.57-.04.86-.04a5.5 5.5 0 0 1 5.5 5.5A5.5 5.5 0 0 1 17.5 19z"/></svg>;

const CheckBoxIcon = ({ checked, isIndeterminate, onClick }: { checked: boolean, isIndeterminate?: boolean, onClick?: () => void }) => (
  <div onClick={onClick} style={{
    width: "14px", height: "14px", borderRadius: "3px",
    border: checked || isIndeterminate ? "1px solid #3574f0" : "1px solid #43454a",
    backgroundColor: checked || isIndeterminate ? "#3574f0" : "transparent",
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
  }}>
    {checked && !isIndeterminate && <svg width="10" height="10" viewBox="0 0 16 16" fill="white"><path d="M11.466 4.346a.75.75 0 0 1 1.068 1.054l-6.5 6.5a.75.75 0 0 1-1.055-.016l-2.5-2.5a.75.75 0 0 1 1.06-1.06l1.962 1.962 5.965-5.94z"/></svg>}
    {isIndeterminate && <div style={{ width: "8px", height: "2px", backgroundColor: "white" }} />}
  </div>
);

// --- MOCK DATA ---
const INITIAL_RULES_DATA = [
  { id: 'R001', name: 'Unused Variables', category: 'Correctness', severity: 'Warning', status: true, checked: true, desc: 'Detect variables that are declared but never used.' },
  { id: 'R002', name: 'Suspicious Infinite Loops', category: 'Safety', severity: 'Warning', status: true, checked: true, desc: 'Detect loops that may never terminate.' },
  { id: 'R003', name: 'Unsafe Recursion Patterns', category: 'Safety', severity: 'Warning', status: true, checked: true, desc: 'Detect recursion without proper base case.' },
  { id: 'R004', name: 'Recursion Depth Risk', category: 'Safety', severity: 'Warning', status: true, checked: true, desc: 'Estimate risk of stack overflow due to deep recursion.' },
  { id: 'R005', name: 'Expensive Repeated Operations', category: 'Performance', severity: 'Warning', status: true, checked: true, desc: 'Detect costly operations inside loops.' },
  { id: 'R006', name: 'Constraint-aware TLE Warnings', category: 'Performance', severity: 'Warning', status: true, checked: true, desc: 'Warn when complexity may exceed time limit.' },
  { id: 'R007', name: 'Missing Return Statement', category: 'Correctness', severity: 'Error', status: true, checked: true, desc: 'Detect non-void functions without return.' },
  { id: 'R008', name: 'Potential Null Pointer Dereference', category: 'Safety', severity: 'Warning', status: false, checked: false, desc: 'Detect possible null pointer dereference.' },
  { id: 'R009', name: 'Redundant Code', category: 'Style', severity: 'Info', status: false, checked: false, desc: 'Detect unreachable or redundant code.' }
];

const INITIAL_COMPILERS = [
  { id: 'c1', name: 'GCC 13.2.0 (x86_64)', path: '/usr/bin/gcc', version: '13.2.0', lang: 'C, C++', status: 'Available', isDefault: true, icon: <GCCIcon /> },
  { id: 'c2', name: 'GCC 11.4.0 (x86_64)', path: '/usr/bin/gcc-11', version: '11.4.0', lang: 'C, C++', status: 'Available', isDefault: false, icon: <ClangIcon /> },
  { id: 'c3', name: 'Clang 17.0.6 (x86_64)', path: '/usr/bin/clang', version: '17.0.6', lang: 'C, C++', status: 'Available', isDefault: false, icon: <ClangIcon /> },
  { id: 'c4', name: 'MinGW-w64 12.2.0', path: 'C:\\mingw64\\bin\\gcc.exe', version: '12.2.0', lang: 'C, C++', status: 'Available', isDefault: false, icon: <WindowsIcon /> },
  { id: 'c5', name: 'Custom Compiler', path: '/opt/custom-compiler/bin/gcc', version: '10.3.0', lang: 'C, C++', status: 'Available', isDefault: false, icon: <CloudIcon /> },
];

const getBadgeStyle = (type: string) => {
  let color = "#8b949e", bg = "rgba(139, 148, 158, 0.1)", border = "rgba(139, 148, 158, 0.2)";
  if (type === "Correctness" || type === "Info") { color = "#58a6ff"; bg = "rgba(88, 166, 255, 0.1)"; border = "rgba(88, 166, 255, 0.2)"; }
  else if (type === "Safety") { color = "#bc8cff"; bg = "rgba(188, 140, 255, 0.1)"; border = "rgba(188, 140, 255, 0.2)"; }
  else if (type === "Performance") { color = "#3fb950"; bg = "rgba(63, 185, 80, 0.1)"; border = "rgba(63, 185, 80, 0.2)"; }
  else if (type === "Warning") { color = "#d29922"; bg = "rgba(210, 153, 34, 0.1)"; border = "rgba(210, 153, 34, 0.2)"; }
  else if (type === "Error") { color = "#f85149"; bg = "rgba(248, 81, 73, 0.1)"; border = "rgba(248, 81, 73, 0.2)"; }
  return { color, backgroundColor: bg, border: `1px solid ${border}`, padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 500 };
};

// --- Helper Components with State Support ---
const SectionDivider = ({ title }: { title: string }) => (
  <div style={{ display: "flex", alignItems: "center", marginTop: "32px", marginBottom: "20px" }}>
    <span style={{ color: "#dfdfdf", fontWeight: "bold", fontSize: "13px", letterSpacing: "0.025em", marginRight: "16px" }}>{title}</span>
    <div style={{ flex: 1, height: "1px", backgroundColor: "#21262d" }}></div>
  </div>
);

const CustomSelect = ({ value, options, onChange }: { value: string, options: string[], onChange: (val: string) => void }) => (
  <div style={{ position: "relative", width: "240px" }}>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", backgroundColor: "#161b22", border: "1px solid #30363d", color: "#dfdfdf", borderRadius: "4px", fontSize: "13px", outline: "none", cursor: "pointer", padding: "6px 12px", appearance: "none" }}
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    <div style={{ position: "absolute", right: "12px", top: 0, bottom: 0, display: "flex", alignItems: "center", pointerEvents: "none", color: "#8b949e" }}>
      <ChevronDown />
    </div>
  </div>
);

const CustomToggle = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => {
  return (
    <div 
      onClick={() => onChange(!checked)}
      style={{ width: "36px", height: "20px", borderRadius: "9999px", position: "relative", cursor: "pointer", transition: "background-color 0.2s", backgroundColor: checked ? "#3574f0" : "#30363d" }}
    >
      <div style={{ position: "absolute", top: "2px", width: "16px", height: "16px", backgroundColor: "white", borderRadius: "9999px", transition: "all 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", left: checked ? "18px" : "2px" }} />
    </div>
  );
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [copied, setCopied] = useState(false);

  // General States
  const [generalState, setGeneralState] = useState({
    language: 'English',
    autoSave: true,
    theme: 'Dark',
    fontFamily: 'JetBrains Mono',
    fontSize: '14px',
    autoBackup: true,
    location: 'D:\\CodeForge\\Project'
  });

  // Rules States
  const [rules, setRules] = useState(INITIAL_RULES_DATA);
  const totalRules = rules.length;
  const enabledRules = rules.filter(r => r.status).length;
  const warnings = rules.filter(r => r.severity === 'Warning' && r.status).length;
  const errors = rules.filter(r => r.severity === 'Error' && r.status).length;

  // Compiler States
  const [compilers, setCompilers] = useState(INITIAL_COMPILERS);
  const activeCompiler = compilers.find(c => c.isDefault) || compilers[0];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopySystemInfo = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetDefaultCompiler = (id: string) => {
    setCompilers(compilers.map(c => ({ ...c, isDefault: c.id === id })));
  };

  const handleToggleRuleStatus = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, status: !r.status, checked: !r.status } : r));
  };

  const handleToggleRuleCheck = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, checked: !r.checked } : r));
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.45)", zIndex: 999999 }}>
      
      <div style={{ width: "1000px", height: "660px", backgroundColor: "#0d1117", borderRadius: "8px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 0 40px rgba(0, 0, 0, 0.6)", border: "1px solid #21262d", fontFamily: "sans-serif" }} onMouseDown={(e) => e.stopPropagation()}>
        
        {/* --- HEADER --- */}
        <div style={{ height: "48px", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", backgroundColor: "#161b22", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", color: "#dfdfdf", fontWeight: 600, fontSize: "13px", gap: "10px" }}>
            <div style={{ width: "20px", height: "20px", backgroundColor: "#3178c6", borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "11px", paddingBottom: "1px" }}>C</div>
            Settings
          </div>
          <div style={{ cursor: "pointer", color: "#8b949e", padding: "4px" }} onClick={onClose}>
            <CloseIcon />
          </div>
        </div>

        {/* --- BODY --- */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          
          {/* Sidebar Kiri */}
          <div style={{ width: "220px", backgroundColor: "#161b22", borderRight: "1px solid #21262d", display: "flex", flexDirection: "column", flexShrink: 0, padding: "12px" }}>
            
            <div style={{ display: "flex", alignItems: "center", backgroundColor: "#0d1117", border: "1px solid #30363d", borderRadius: "4px", height: "32px", paddingLeft: "10px", paddingRight: "10px", marginBottom: "16px" }}>
              <span style={{ color: "#8b949e", marginRight: "8px" }}><SearchIcon /></span>
              <input 
                type="text" 
                placeholder="Search" 
                style={{ width: "100%", backgroundColor: "transparent", border: "none", outline: "none", color: "#dfdfdf", fontSize: "13px" }} 
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div onClick={() => setActiveTab('general')} style={{ display: "flex", alignItems: "center", height: "32px", borderRadius: "4px", fontSize: "13px", cursor: "pointer", paddingLeft: "12px", paddingRight: "12px", marginBottom: "4px", backgroundColor: activeTab === 'general' ? "#1c212b" : "transparent", color: activeTab === 'general' ? "white" : "#c9d1d9", fontWeight: activeTab === 'general' ? 600 : 500 }}>General</div>
              <div onClick={() => setActiveTab('rules')} style={{ display: "flex", alignItems: "center", height: "32px", borderRadius: "4px", fontSize: "13px", cursor: "pointer", paddingLeft: "12px", paddingRight: "12px", marginBottom: "4px", backgroundColor: activeTab === 'rules' ? "#1c212b" : "transparent", color: activeTab === 'rules' ? "white" : "#c9d1d9", fontWeight: activeTab === 'rules' ? 600 : 500 }}>Rules</div>
              <div onClick={() => setActiveTab('compiler')} style={{ display: "flex", alignItems: "center", height: "32px", borderRadius: "4px", fontSize: "13px", cursor: "pointer", paddingLeft: "12px", paddingRight: "12px", marginBottom: "4px", backgroundColor: activeTab === 'compiler' ? "#1c212b" : "transparent", color: activeTab === 'compiler' ? "white" : "#c9d1d9", fontWeight: activeTab === 'compiler' ? 600 : 500 }}>Compiler</div>
            </div>
          </div>

          {/* Area Konten Kanan */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#0d1117", position: "relative" }}>
            <style>{`.settings-scroll::-webkit-scrollbar { width: 10px; height: 10px; } .settings-scroll::-webkit-scrollbar-track { background: transparent; } .settings-scroll::-webkit-scrollbar-thumb { background: #30363d; border: 3px solid #0d1117; border-radius: 6px; } .settings-scroll::-webkit-scrollbar-thumb:hover { background: #45484d; }`}</style>
            
            <div className="settings-scroll" style={{ flex: 1, overflowY: "auto", paddingTop: "0px", paddingBottom: "80px", paddingLeft: '20px', paddingRight: '20px' }}>
              
              {/* ========================================= */}
              {/* TAB: GENERAL                               */}
              {/* ========================================= */}
              {activeTab === 'general' && (
                <>
                  <SectionDivider title="Application" />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#dfdfdf", fontSize: "13px", fontWeight: 500, marginBottom: "2px" }}>Language</span>
                        <span style={{ color: "#8b949e", fontSize: "12px" }}>Choose your preferred language</span>
                      </div>
                      <CustomSelect value={generalState.language} onChange={(val) => setGeneralState({...generalState, language: val})} options={['English', 'Indonesian']} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#dfdfdf", fontSize: "13px", fontWeight: 500, marginBottom: "2px" }}>Auto Save</span>
                        <span style={{ color: "#8b949e", fontSize: "12px" }}>Automatically save files</span>
                      </div>
                      <CustomToggle checked={generalState.autoSave} onChange={(val) => setGeneralState({...generalState, autoSave: val})} />
                    </div>
                  </div>

                  <SectionDivider title="Appearance" />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#dfdfdf", fontSize: "13px", fontWeight: 500, marginBottom: "2px" }}>Theme</span>
                        <span style={{ color: "#8b949e", fontSize: "12px" }}>Choose your preferred theme</span>
                      </div>
                      <CustomSelect value={generalState.theme} onChange={(val) => setGeneralState({...generalState, theme: val})} options={['Dark', 'Light', 'System']} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#dfdfdf", fontSize: "13px", fontWeight: 500, marginBottom: "2px" }}>Font Family</span>
                        <span style={{ color: "#8b949e", fontSize: "12px" }}>Editor font family</span>
                      </div>
                      <CustomSelect value={generalState.fontFamily} onChange={(val) => setGeneralState({...generalState, fontFamily: val})} options={['JetBrains Mono', 'Fira Code', 'Consolas']} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#dfdfdf", fontSize: "13px", fontWeight: 500, marginBottom: "2px" }}>Font Size</span>
                        <span style={{ color: "#8b949e", fontSize: "12px" }}>Editor font size</span>
                      </div>
                      <CustomSelect value={generalState.fontSize} onChange={(val) => setGeneralState({...generalState, fontSize: val})} options={['12px', '13px', '14px', '16px', '18px']} />
                    </div>
                  </div>

                  <SectionDivider title="Files & Backup" />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#dfdfdf", fontSize: "13px", fontWeight: 500, marginBottom: "2px" }}>Auto Backup</span>
                        <span style={{ color: "#8b949e", fontSize: "12px" }}>Enable automatic backup of projects</span>
                      </div>
                      <CustomToggle checked={generalState.autoBackup} onChange={(val) => setGeneralState({...generalState, autoBackup: val})} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#dfdfdf", fontSize: "13px", fontWeight: 500, marginBottom: "2px" }}>Default Project Location</span>
                        <span style={{ color: "#8b949e", fontSize: "12px" }}>Where new projects will be created</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "4px", overflow: "hidden", width: "240px", height: "32px" }}>
                        <input 
                          type="text" 
                          value={generalState.location}
                          onChange={(e) => setGeneralState({...generalState, location: e.target.value})}
                          style={{ flex: 1, minWidth: 0, backgroundColor: "transparent", border: "none", outline: "none", color: "#dfdfdf", fontSize: "13px", paddingLeft: "12px", paddingRight: "12px" }} 
                        />
                        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid #30363d", color: "#8b949e", cursor: "pointer", width: "36px", flexShrink: 0 }}>
                          <FolderIcon />
                        </div>
                      </div>
                    </div>
                  </div>

                  <SectionDivider title="System Information" />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", fontSize: "13px", marginBottom: "12px" }}>
                      <span style={{ color: "#8b949e", width: "140px" }}>Version</span>
                      <span style={{ color: "#dfdfdf" }}>1.0.0</span>
                    </div>
                    <div style={{ display: "flex", fontSize: "13px", marginBottom: "12px" }}>
                      <span style={{ color: "#8b949e", width: "140px" }}>Platform</span>
                      <span style={{ color: "#dfdfdf" }}>Windows 11 (64-bit)</span>
                    </div>
                    <div style={{ display: "flex", fontSize: "13px", marginBottom: "12px" }}>
                      <span style={{ color: "#8b949e", width: "140px" }}>Node.js</span>
                      <span style={{ color: "#dfdfdf" }}>v20.11.1</span>
                    </div>
                    <div style={{ display: "flex", fontSize: "13px", marginBottom: "12px" }}>
                      <span style={{ color: "#8b949e", width: "140px" }}>Memory</span>
                      <span style={{ color: "#dfdfdf" }}>16 GB</span>
                    </div>
                    <div style={{ display: "flex", fontSize: "13px", marginBottom: "20px" }}>
                      <span style={{ color: "#8b949e", width: "140px" }}>Processor</span>
                      <span style={{ color: "#dfdfdf" }}>Intel Core i7-12700H</span>
                    </div>
                    <button 
                      onClick={handleCopySystemInfo}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: copied ? "1px solid #3fb950" : "1px solid #30363d", borderRadius: "4px", color: copied ? "#3fb950" : "#dfdfdf", fontSize: "13px", fontWeight: 500, width: "240px", height: "32px", gap: "8px", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      {copied ? <><CheckIcon /> Copied!</> : <>Copy System info <CopyIcon /></>}
                    </button>
                  </div>
                </>
              )}

              {/* ========================================= */}
              {/* TAB: RULES                                  */}
              {/* ========================================= */}
              {activeTab === 'rules' && (
                <div style={{ paddingTop: "24px" }}>
                  <h2 style={{ color: "#dfdfdf", fontSize: "16px", fontWeight: "bold", margin: 0 }}>Rules</h2>
                  <p style={{ color: "#8b949e", fontSize: "13px", marginTop: "4px", marginBottom: "20px" }}>Configure static analysis rules used by the Rules Engine.</p>
                  
                  {/* --- STATS BOXES --- */}
                  <div style={{ display: "flex", gap: "12px", marginBottom: "24px", alignItems: "flex-start" }}>
                    <div style={{ border: "1px solid #30363d", borderRadius: "6px", padding: "12px 16px", minWidth: "90px", backgroundColor: "transparent" }}>
                      <div style={{ color: "#8b949e", fontSize: "12px", marginBottom: "4px" }}>Total Rules</div>
                      <div style={{ color: "#dfdfdf", fontSize: "18px", fontWeight: 500 }}>{totalRules}</div>
                    </div>
                    <div style={{ border: "1px solid #30363d", borderRadius: "6px", padding: "12px 16px", minWidth: "90px", backgroundColor: "transparent" }}>
                      <div style={{ color: "#3fb950", fontSize: "12px", marginBottom: "4px" }}>Enabled</div>
                      <div style={{ color: "#3fb950", fontSize: "18px", fontWeight: 500 }}>{enabledRules}</div>
                    </div>
                    <div style={{ border: "1px solid #30363d", borderRadius: "6px", padding: "12px 16px", minWidth: "90px", backgroundColor: "transparent" }}>
                      <div style={{ color: "#d29922", fontSize: "12px", marginBottom: "4px" }}>Warnings</div>
                      <div style={{ color: "#d29922", fontSize: "18px", fontWeight: 500 }}>{warnings}</div>
                    </div>
                    <div style={{ border: "1px solid #30363d", borderRadius: "6px", padding: "12px 16px", minWidth: "90px", backgroundColor: "transparent" }}>
                      <div style={{ color: "#f85149", fontSize: "12px", marginBottom: "4px" }}>Errors</div>
                      <div style={{ color: "#f85149", fontSize: "18px", fontWeight: 500 }}>{errors}</div>
                    </div>
                    
                    <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
                       <span onClick={() => setRules(INITIAL_RULES_DATA)} style={{ color: "#dfdfdf", fontSize: "12px", textDecoration: "underline", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#58a6ff"} onMouseLeave={e => e.currentTarget.style.color = "#dfdfdf"}>Reset to Default</span>
                    </div>
                  </div>

                  {/* --- RULES TABLE --- */}
                  <div style={{ border: "1px solid #30363d", borderRadius: "8px", backgroundColor: "#161b22", overflow: "hidden" }}>
                    {/* Header Table */}
                    <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #30363d", fontSize: "12px", fontWeight: 600, color: "#8b949e" }}>
                      <div style={{ width: "32px", flexShrink: 0 }}><CheckBoxIcon checked={rules.every(r => r.checked)} isIndeterminate={rules.some(r => r.checked) && !rules.every(r => r.checked)} onClick={() => { const allC = rules.every(r => r.checked); setRules(rules.map(r => ({...r, checked: !allC}))) }} /></div>
                      <div style={{ width: "200px", flexShrink: 0 }}>Rules</div>
                      <div style={{ width: "90px", flexShrink: 0 }}>Category</div>
                      <div style={{ width: "75px", flexShrink: 0 }}>Severity</div>
                      <div style={{ width: "60px", flexShrink: 0 }}>Status</div>
                      <div style={{ flex: 1, minWidth: 0 }}>Description</div>
                    </div>

                    {/* Content Table */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {rules.map((rule, idx) => (
                        <div key={rule.id} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: idx === rules.length - 1 ? "none" : "1px solid #21262d", fontSize: "12px" }}>
                           <div style={{ width: "32px", flexShrink: 0 }}>
                             <CheckBoxIcon checked={rule.checked} onClick={() => handleToggleRuleCheck(rule.id)} />
                           </div>
                           <div style={{ width: "190px", flexShrink: 0, color: "#dfdfdf", paddingRight: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                             <span style={{ color: "#8b949e", marginRight: "8px" }}>{rule.id}</span>
                             {rule.name}
                           </div>
                           <div style={{ width: "90px", flexShrink: 0 }}>
                             <span style={getBadgeStyle(rule.category)}>{rule.category}</span>
                           </div>
                           <div style={{ width: "75px", flexShrink: 0 }}>
                             <span style={getBadgeStyle(rule.severity)}>{rule.severity}</span>
                           </div>
                           <div style={{ width: "60px", flexShrink: 0 }}>
                             <CustomToggle checked={rule.status} onChange={() => handleToggleRuleStatus(rule.id)} />
                           </div>
                           <div style={{ flex: 1, minWidth: 0, color: "#dfdfdf", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "normal", lineHeight: "1.4" }}>
                             {rule.desc}
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================= */}
              {/* TAB: COMPILER                               */}
              {/* ========================================= */}
              {activeTab === 'compiler' && (
                <div style={{ paddingTop: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div>
                      <h2 style={{ color: "#dfdfdf", fontSize: "16px", fontWeight: "bold", margin: 0 }}>Compiler</h2>
                      <p style={{ color: "#8b949e", fontSize: "13px", marginTop: "4px", margin: 0 }}>Manage and configure compilers used for building and running your code.</p>
                    </div>
                    <button style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#3574f0", color: "white", border: "none", borderRadius: "4px", padding: "6px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "background-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#2a5dc0"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "#3574f0"}>
                      <PlusIcon /> Add Compiler
                    </button>
                  </div>
                  
                  {/* --- ACTIVE COMPILER CARD --- */}
                  <div style={{ border: "1px solid #30363d", borderRadius: "8px", backgroundColor: "#1c212b", padding: "16px", marginBottom: "24px" }}>
                    <div style={{ color: "#dfdfdf", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>Active Compiler</div>
                    <div style={{ color: "#dfdfdf", fontSize: "18px", fontWeight: 600, marginBottom: "6px" }}>{activeCompiler.name}</div>
                    <div style={{ color: "#8b949e", fontSize: "13px", marginBottom: "4px" }}>{activeCompiler.path}</div>
                    <div style={{ color: "#8b949e", fontSize: "13px" }}>{activeCompiler.lang}</div>
                  </div>

                  {/* --- INSTALLED COMPILER TABLE --- */}
                  <div style={{ color: "#dfdfdf", fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Installed Compiler</div>
                  
                  <div style={{ border: "1px solid #30363d", borderRadius: "8px", backgroundColor: "#161b22", overflow: "hidden", marginBottom: "16px" }}>
                    
                    {/* Header Table */}
                    <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #30363d", fontSize: "12px", fontWeight: 600, color: "#8b949e" }}>
                      <div style={{ flex: 1.8 }}>Compiler</div>
                      <div style={{ flex: 0.8 }}>Version</div>
                      <div style={{ flex: 0.8 }}>Language</div>
                      <div style={{ flex: 1 }}>Status</div>
                      <div style={{ flex: 0.5 }}>Default</div>
                      <div style={{ width: "24px" }}></div>
                    </div>

                    {/* Content Table */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {compilers.map((comp, idx) => (
                        <div key={comp.id} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: idx === compilers.length - 1 ? "none" : "1px solid #21262d", fontSize: "13px" }}>
                           
                           <div style={{ flex: 1.8, display: "flex", alignItems: "center", color: "#dfdfdf", paddingRight: "16px" }}>
                             <div style={{ width: "32px", flexShrink: 0, display: "flex", alignItems: "center" }}>{comp.icon}</div>
                             <div style={{ display: "flex", flexDirection: "column" }}>
                               <span style={{ fontWeight: 500, marginBottom: "2px" }}>{comp.name}</span>
                               <span style={{ color: "#8b949e", fontSize: "11px" }}>{comp.path}</span>
                             </div>
                           </div>
                           
                           <div style={{ flex: 0.8, color: "#dfdfdf" }}>{comp.version}</div>
                           <div style={{ flex: 0.8, color: "#dfdfdf" }}>{comp.lang}</div>
                           
                           <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", color: "#dfdfdf" }}>
                             <div style={{ width: "8px", height: "8px", borderRadius: "9999px", backgroundColor: "#3fb950" }}></div>
                             {comp.status}
                           </div>
                           
                           <div style={{ flex: 0.5, display: "flex", cursor: "pointer" }} onClick={() => handleSetDefaultCompiler(comp.id)}>
                             {comp.isDefault ? <StarSolid /> : <StarOutline />}
                           </div>
                           
                           <div style={{ width: "24px", color: "#8b949e", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                             <MoreVertIcon />
                           </div>

                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8b949e", fontSize: "12px" }}>
                    <InfoOutlineIcon />
                    Drag to reorder compilers. The first compiler will be used by default.
                  </div>

                </div>
              )}

            </div>

            {/* --- BOTTOM ACTION BAR --- */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#161b22", borderTop: "1px solid #21262d", display: "flex", alignItems: "center", justifyContent: "flex-end", height: "64px", paddingRight: "32px", boxShadow: "0 -4px 12px rgba(0,0,0,0.1)" }}>
              <button onClick={onClose} style={{ fontSize: "13px", fontWeight: 500, color: "#dfdfdf", backgroundColor: "transparent", border: "1px solid #30363d", borderRadius: "4px", height: "32px", paddingLeft: "20px", paddingRight: "20px", marginRight: "12px", cursor: "pointer" }}>Cancel</button>
              <button onClick={onClose} style={{ fontSize: "13px", fontWeight: 500, color: "white", backgroundColor: "#3574f0", border: "1px solid #3574f0", borderRadius: "4px", height: "32px", paddingLeft: "24px", paddingRight: "24px", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>Save Changes</button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}