import React, { useState, useEffect, useRef } from "react";
import { Command } from "@tauri-apps/plugin-shell";
import { TestCaseData } from "../../App";

interface BottomPanelProps {
  activeMenu: "analysis" | "test-output" | "terminal" | string | null;
  setActiveMenu: (menu: string | null) => void;
  onOpenSettings?: () => void;
  isSettingsOpen?: boolean;
  testCases: TestCaseData[];
  setTestCases: (tcs: TestCaseData[]) => void;
  activeTestCaseTab: number;
  setActiveTestCaseTab: (id: number) => void;
  hasRunTests: boolean;
}

// --- Icons SVG ---
const CloseIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z" /></svg>;
const AddIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3a.5.5 0 0 1 .5.5v4h4a.5.5 0 0 1 0 1h-4v4a.5.5 0 0 1-1 0v-4h-4a.5.5 0 0 1 0-1h4v-4A.5.5 0 0 1 8 3z" /></svg>;
const ChevronDown = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6L8 10L12 6" /></svg>;
const ChevronRight = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 4L10 8L6 12" /></svg>;
const OptionsIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" /></svg>;
const MinimizeIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 7.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" /></svg>;

// Terminal Tools Icons
const PlayIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const StopIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const SplitIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>;
const GearIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1.5v2h3v-2h-3zm-2.5.5h-2v12h12v-12h-2v2.5h-8v-2.5zM2 1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm8 8.5a2 2 0 1 0-4 0 2 2 0 0 0 4 0z" /></svg>;

// Terminal Tree Icons
const SplitInlineIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-9zM3.5 3a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5H7V3H3.5zM8 13h4.5a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5H8v10z"/></svg>;
const TerminalNodeIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-9zm1.5-.5a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-9zM6.85 7.15l-2-2-.7.7L5.79 7.5 4.15 9.15l.7.7 2-2a.5.5 0 0 0 0-.71zM11 9.5H7.5v1H11v-1z"/></svg>;
const TreeTopBranch = () => (
  <svg width="16" height="32" viewBox="0 0 16 32" fill="none" className="shrink-0">
    <path d="M 8 16 L 16 16 M 8 16 L 8 32" stroke="#454545" strokeWidth="1" shapeRendering="crispEdges"/>
  </svg>
);
const TreeMiddleBranch = () => (
  <svg width="16" height="32" viewBox="0 0 16 32" fill="none" className="shrink-0">
    <path d="M 8 0 L 8 32 M 8 16 L 16 16" stroke="#454545" strokeWidth="1" shapeRendering="crispEdges"/>
  </svg>
);
const TreeLastBranch = () => (
  <svg width="16" height="32" viewBox="0 0 16 32" fill="none" className="shrink-0">
    <path d="M 8 0 L 8 16 M 8 16 L 16 16" stroke="#454545" strokeWidth="1" shapeRendering="crispEdges"/>
  </svg>
);

// Analysis Icons
const ErrorIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="#f85149"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"/></svg>;
const WarningIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="#d29922"><path d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"/></svg>;
const InfoIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="#58a6ff"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z"/></svg>;
const FilterIcon = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" opacity="0.6"><path d="M1.5 3h13l-5 5.5v4.5l-3 2v-6.5l-5-5.5z"/></svg>;
const ArrowRightTriangle = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="#f85149"><path d="M4 2l8 6-8 6V2z"/></svg>;

// --- Tooltip Component ---
function Tooltip({ text, position = 'right' }: { text: string, position?: 'right' | 'top' | 'bottom' | 'left' }) {
  let posClass = 'left-full ml-[10px] top-1/2 -translate-y-1/2'; 
  if (position === 'top') posClass = 'bottom-full mb-[10px] left-1/2 -translate-x-1/2';
  if (position === 'bottom') posClass = 'top-full mt-[10px] left-1/2 -translate-x-1/2';
  if (position === 'left') posClass = 'right-full mr-[10px] top-1/2 -translate-y-1/2';

  return (
    <div 
      className={`absolute ${posClass} opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 pointer-events-none whitespace-nowrap z-[99999]`}
      style={{ 
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

const INITIAL_TERMINAL_TEXT = [
  "Windows PowerShell",
  "Copyright (C) Microsoft Corporation. All rights reserved.",
  "",
  "Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows",
  "",
];

interface TerminalPane {
  id: string;
  name: string;
  history: string[];
  input: string;
}

interface TerminalSession {
  id: string;
  name: string;
  panes: TerminalPane[];
}

const ANALYSIS_ISSUES = [
  { id: "err-1", type: "error", title: "Buffer overflow risk (gets)", code: "ts(1109)", locStr: "[Ln 24, Col 22]", location: "main.ts [Ln 24, Col 22]", why: "gets() does not perform bounds checking. This can cause buffer overflow.", suggestion: "Use fgets(buf, sizeof(buf), stdin) instead.", snippetCode: "gets(buf);", snippetComment: "// unsafe (buffer overflow risk)", lineNum: 22 },
  { id: "err-2", type: "error", title: "Suspicious infinite loop", code: "ts(1109)", locStr: "[Ln 25, Col 19]", location: "app.component.ts [Ln 25, Col 19]", why: "The loop condition never evaluates to false because the counter is not incremented.", suggestion: "Ensure the loop variable is modified inside the loop body.", snippetCode: "while (isActive) {", snippetComment: "// isActive is never mutated", lineNum: 25 },
  { id: "warn-1", type: "warning", title: "Variable 'arr' is declared but never used after sum", code: "ts(1003)", locStr: "[Ln 28, Col 11]", location: "app.component.ts [Ln 28, Col 11]", why: "Declaring variables without using them wastes memory and reduces code readability.", suggestion: "Remove the variable declaration or use it.", snippetCode: "let arr = [];", snippetComment: "// 'arr' is declared here", lineNum: 28 },
  { id: "warn-2", type: "warning", title: "Calling scanf in loop without checking return value", code: "ts(119)", locStr: "[Ln 21, Col 22]", location: "main.c [Ln 21, Col 22]", why: "If scanf fails to read, the loop may process garbage data or run infinitely.", suggestion: "Check if scanf returns the expected number of assignments.", snippetCode: "scanf(\"%d\", &val);", snippetComment: "// missing return check", lineNum: 21 },
  { id: "info-1", type: "info", title: "Consider using long long for potential overflow", code: "ts(1110)", locStr: "[Ln 23, Col 23]", location: "app.component.ts [Ln 23, Col 23]", why: "The arithmetic operation might exceed the maximum value for a standard 32-bit integer.", suggestion: "Change the data type from 'int' to 'long long'.", snippetCode: "int total = a * b;", snippetComment: "// potential overflow", lineNum: 23 }
];

export function BottomPanel({ activeMenu, setActiveMenu, onOpenSettings, isSettingsOpen, testCases, setTestCases, activeTestCaseTab, setActiveTestCaseTab, hasRunTests }: BottomPanelProps) {
  const [panelHeight, setPanelHeight] = useState(320); 
  const [isDragging, setIsDragging] = useState(false);

  // --- MULTI-PANE TERMINAL STATES ---
  const [sessions, setSessions] = useState<TerminalSession[]>([
    { id: "s1", name: "powershell", panes: [{ id: "p1", name: "powershell", history: INITIAL_TERMINAL_TEXT, input: "" }] }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>("s1");
  const [activePaneId, setActivePaneId] = useState<string>("p1");

  // --- ANALYSIS STATES ---
  const [filterText, setFilterText] = useState("");
  const [isFileGroupExpanded, setIsFileGroupExpanded] = useState(true);
  const [activeIssueId, setActiveIssueId] = useState<string>("err-1");

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) {
      if (sessions.length > 0) {
        setActiveSessionId(sessions[0].id);
        setActivePaneId(sessions[0].panes[0].id);
      }
    } else {
      const currentPane = currentSession.panes.find(p => p.id === activePaneId);
      if (!currentPane && currentSession.panes.length > 0) {
        setActivePaneId(currentSession.panes[0].id);
      }
    }
  }, [sessions, activeSessionId, activePaneId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Memodifikasi satu pane tertentu di dalam satu sesi tertentu
  const updatePane = (sessionId: string, paneId: string, updater: (pane: TerminalPane) => TerminalPane) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      return { ...s, panes: s.panes.map(p => p.id === paneId ? updater(p) : p) };
    }));
  };

  const updatePaneHistory = (sessionId: string, paneId: string, historyUpdater: (prev: string[]) => string[]) => {
    updatePane(sessionId, paneId, p => ({ ...p, history: historyUpdater(p.history) }));
  };

  const setPaneInput = (sessionId: string, paneId: string, input: string) => {
    updatePane(sessionId, paneId, p => ({ ...p, input }));
  };

  // Eksekusi Perintah berdasarkan Pane ID
  const handleCommandExecute = async (e: React.KeyboardEvent<HTMLInputElement>, sessionId: string, paneId: string, currentInput: string) => {
    if (e.key === "Enter") {
      const cmd = currentInput.trim();
      setPaneInput(sessionId, paneId, "");
      updatePaneHistory(sessionId, paneId, prev => [...prev, `PS C:\\Users\\CComp\\Workspace> ${cmd}`]);
      
      if (!cmd) return;
      if (cmd.toLowerCase() === "clear" || cmd.toLowerCase() === "cls") {
        updatePaneHistory(sessionId, paneId, () => []);
        return;
      }
      try {
        const output = await Command.create("powershell", ["-NoProfile", "-Command", cmd]).execute();
        if (output.stdout) updatePaneHistory(sessionId, paneId, prev => [...prev, ...output.stdout.trim().split("\n")]);
        if (output.stderr) updatePaneHistory(sessionId, paneId, prev => [...prev, ...output.stderr.trim().split("\n").map(err => `<Error> ${err}`)]);
      } catch (error: any) {
        updatePaneHistory(sessionId, paneId, prev => [...prev, `[Tauri Shell Error]: ${error.message || error}`]);
      }
    }
  };

  // Manajemen Sesi & Splitting Terminal
  const handleAddSession = () => {
    const newId = Date.now().toString();
    const newPaneId = newId + "-p1";
    setSessions((prev) => [...prev, { id: newId, name: `powershell`, panes: [{ id: newPaneId, name: "powershell", history: INITIAL_TERMINAL_TEXT, input: "" }] }]);
    setActiveSessionId(newId);
    setActivePaneId(newPaneId);
  };

  const handleSplitPane = (sessionId: string) => {
    const newPaneId = Date.now().toString();
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, panes: [...s.panes, { id: newPaneId, name: "powershell", history: INITIAL_TERMINAL_TEXT, input: "" }] };
      }
      return s;
    }));
    setActiveSessionId(sessionId);
    setActivePaneId(newPaneId);
  };

  const handleCloseSession = (sessionId: string) => {
    setSessions(prev => {
      const nextSessions = prev.filter(s => s.id !== sessionId);
      if (nextSessions.length === 0) {
        return [{ id: Date.now().toString(), name: "powershell", panes: [{ id: Date.now().toString() + "-p1", name: "powershell", history: INITIAL_TERMINAL_TEXT, input: "" }] }];
      }
      return nextSessions;
    });
  };

  const handleClosePane = (sessionId: string, paneId: string) => {
    setSessions(prev => {
      let nextSessions = prev.map(s => {
        if (s.id === sessionId) return { ...s, panes: s.panes.filter(p => p.id !== paneId) };
        return s;
      });
      nextSessions = nextSessions.filter(s => s.panes.length > 0);
      if (nextSessions.length === 0) {
        nextSessions.push({ id: Date.now().toString(), name: "powershell", panes: [{ id: Date.now().toString() + "-p1", name: "powershell", history: INITIAL_TERMINAL_TEXT, input: "" }] });
      }
      return nextSessions;
    });
  };

  // Manajemen Test Case
  const handleAddTestCase = () => {
    const newId = testCases.length > 0 ? Math.max(...testCases.map(t => t.id)) + 1 : 1;
    setTestCases([...testCases, { id: newId, input: "", expected: "" }]);
    setActiveTestCaseTab(newId);
  };

  const handleCloseTestCase = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTCs = testCases.filter(t => t.id !== id);
    setTestCases(newTCs);
    if (activeTestCaseTab === id) {
      const idx = testCases.findIndex(t => t.id === id);
      if (newTCs.length > 0) {
        setActiveTestCaseTab(newTCs[Math.max(0, idx - 1)].id);
      } else {
        setActiveTestCaseTab(0);
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight >= 120 && newHeight <= window.innerHeight * 0.8) setPanelHeight(newHeight);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.classList.remove("cursor-row-resize");
    };
    if (isDragging) {
      document.body.classList.add("cursor-row-resize");
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.body.classList.remove("cursor-row-resize");
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!activeMenu) return null;

  const filteredIssues = ANALYSIS_ISSUES.filter(issue => 
    issue.title.toLowerCase().includes(filterText.toLowerCase()) || 
    issue.code.toLowerCase().includes(filterText.toLowerCase())
  );
  const activeIssue = ANALYSIS_ISSUES.find(i => i.id === activeIssueId) || ANALYSIS_ISSUES[0];

  const currentTest = testCases.find(tc => tc.id === activeTestCaseTab) || testCases[0];

  return (
    <div
      style={{ height: `${panelHeight}px` }}
      className="w-full bg-[#0d1117] flex flex-col relative shrink-0 border-t border-[#21262d] font-sans shadow-[0_-4px_10px_rgba(0,0,0,0.2)]"
    >
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2b2d31; border: 3px solid #0d1117; border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #45484d; }
      `}</style>

      {/* --- GARIS RESIZER (ATAS) --- */}
      <div 
        className={`absolute top-0 left-0 w-full h-[4px] z-[9999] transition-colors duration-150 ease-in-out ${
          isDragging ? 'bg-[#3574f0] cursor-row-resize' : 'hover:bg-[#3574f0] bg-transparent cursor-row-resize'
        }`}
        style={{ transform: 'translateY(-50%)' }}
        onMouseDown={(e) => { 
          e.preventDefault(); 
          setIsDragging(true); 
        }}
      />

      <div 
        className="flex items-center justify-between bg-[#161b22] border-b border-[#21262d] shrink-0 select-none overflow-visible relative"
        style={{ height: "42px" }}
      >
        <div className="flex items-end h-full min-w-0 flex-1 relative">
          
          {activeMenu === "terminal" && (
            <div className="flex items-center h-full w-full overflow-hidden">
              <div 
                className="flex items-center h-full text-[12px] font-bold text-[#8b949e] tracking-[0.1em] shrink-0 border-r border-[#21262d]"
                style={{ paddingLeft: "15px", paddingRight: "20px", paddingTop: "10px" }}
              >
                <span style={{ paddingBottom: "10px" }}>Terminal</span>
              </div>
              <div className="flex items-center h-full flex-1"></div>
            </div>
          )}

          {activeMenu === "test-output" && (
            <div className="flex items-center h-full w-full overflow-x-auto custom-scrollbar">
              <div 
                className="flex items-center h-full text-[12px] font-bold text-[#8b949e] tracking-[0.1em] shrink-0 border-r border-[#21262d]"
                style={{ paddingLeft: "15px", paddingRight: "20px", paddingTop: "10px" }}
              >
                <span style={{ paddingBottom: "10px" }}>Test Output</span>
              </div>

              {hasRunTests && testCases.map((tab, index) => (
                <div 
                  key={tab.id}
                  onClick={() => setActiveTestCaseTab(tab.id)}
                  className={`flex items-center h-full cursor-pointer shrink-0 transition-colors border-r border-[#21262d] group`}
                  style={{ minWidth: "120px", maxWidth: "180px", padding: "0 10px" }}
                >
                  <div className={`flex items-center justify-between w-full h-[28px] rounded-[6px] px-[12px] transition-colors ${
                    activeTestCaseTab === tab.id 
                      ? "bg-[#21262d] text-[#c9d1d9]" 
                      : "text-[#8b949e] group-hover:bg-[#1c212b] group-hover:text-[#c9d1d9]"
                  }`}>
                    <span className="truncate text-[13px] font-medium" style={{ paddingTop: "2px" }}>
                      Test Case {index + 1}
                    </span>
                    <span 
                      className="flex items-center justify-center shrink-0 hover:bg-[#30363d] rounded-[4px] cursor-pointer transition-colors text-[#8b949e] hover:text-[#c9d1d9]" 
                      style={{ width: "20px", height: "20px", marginLeft: "12px" }}
                      onClick={(e) => handleCloseTestCase(tab.id, e)}
                      title="Close"
                    >
                      <CloseIcon />
                    </span>
                  </div>
                </div>
              ))}
              
              {hasRunTests && (
                <div 
                  onClick={handleAddTestCase} 
                  className="relative group hover:text-[#c9d1d9] hover:bg-[#30363d] rounded-[6px] cursor-pointer transition-colors text-[#8b949e] shrink-0 flex items-center justify-center" 
                  style={{ padding: "8px", marginLeft: "10px" }}
                >
                  <AddIcon />
                  <Tooltip text="Add Test Case" position="bottom" />
                </div>
              )}
            </div>
          )}

          {activeMenu === "analysis" && (
            <div className="flex items-center h-full w-full overflow-hidden">
              <div 
                className="flex items-center h-full text-[12px] font-bold text-[#8b949e] tracking-[0.1em] shrink-0 border-r border-[#21262d]"
                style={{ paddingLeft: "15px", paddingRight: "20px", paddingTop: "10px" }}
              >
                <span style={{ paddingBottom: "10px" }}>Analysis</span>
              </div>
            </div>
          )}

        </div>

        <div className="flex items-center h-full shrink-0 bg-[#161b22] z-10" style={{ paddingLeft: "10px", paddingRight: "10px" }}>
          <div 
            onClick={onOpenSettings} 
            className="relative group rounded-[6px] cursor-pointer transition-all flex items-center justify-center" 
            style={{ 
              padding: "8px", 
              marginRight: "6px",
              backgroundColor: isSettingsOpen ? "#30363d" : "transparent",
              color: isSettingsOpen ? "#c9d1d9" : "#8b949e"
            }} 
            onMouseEnter={(e) => {
              if (!isSettingsOpen) {
                e.currentTarget.style.backgroundColor = "#30363d";
                e.currentTarget.style.color = "#c9d1d9";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSettingsOpen) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#8b949e";
              }
            }}
          >
            <OptionsIcon />
            <Tooltip text="Options" position="bottom" />
          </div>
          <div 
            className="relative group hover:text-[#c9d1d9] hover:bg-[#30363d] rounded-[6px] flex items-center justify-center cursor-pointer transition-colors" 
            style={{ padding: "8px" }} 
            onClick={() => setActiveMenu(null)}
          >
            <MinimizeIcon />
            <Tooltip text="Hide Panel" position="bottom" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-[#0d1117]">
        
        {/* ================= MULTI-PANE TERMINAL VIEW ================= */}
        {activeMenu === "terminal" && (
          <>
            {/* TOOLBAR KIRI */}
            <div className="w-[44px] bg-[#161b22] border-r border-[#21262d] flex flex-col items-center justify-between py-2 shrink-0 text-[#8b949e]">
              <div className="flex flex-col w-full items-center" style={{ gap: "10px" }}>
                <div 
                  className="relative group p-[8px] flex items-center justify-center hover:text-[#3fb950] hover:bg-[#30363d] rounded-[6px] cursor-pointer transition-colors" 
                  onClick={() => updatePaneHistory(activeSessionId, activePaneId, () => INITIAL_TERMINAL_TEXT)}
                >
                  <PlayIcon />
                  <Tooltip text="Restart Session" position="right" />
                </div>
                <div 
                  className="relative group p-[8px] flex items-center justify-center hover:text-[#f85149] hover:bg-[#30363d] rounded-[6px] cursor-pointer transition-colors" 
                  onClick={() => updatePaneHistory(activeSessionId, activePaneId, prev => [...prev, "\n<Error> Process forcefully terminated by user."])}
                >
                  <StopIcon />
                  <Tooltip text="Stop Process" position="right" />
                </div>
                <div 
                  className="relative group p-[8px] flex items-center justify-center hover:text-[#c9d1d9] hover:bg-[#30363d] rounded-[6px] cursor-pointer transition-colors" 
                  onClick={() => updatePaneHistory(activeSessionId, activePaneId, () => [])}
                >
                  <TrashIcon />
                  <Tooltip text="Clear Buffer" position="right" />
                </div>
                <div 
                  className="relative group p-[8px] flex items-center justify-center hover:text-[#c9d1d9] hover:bg-[#30363d] rounded-[6px] cursor-pointer transition-colors" 
                  onClick={() => handleSplitPane(activeSessionId)}
                >
                  <SplitIcon />
                  <Tooltip text="Split Terminal" position="right" />
                </div>
              </div>
            </div>

            {/* AREA TERMINAL */}
            <div className="flex-1 flex overflow-hidden relative bg-[#0d1117]">
              {activeSession?.panes.map((pane, idx) => {
                const isActivePane = activePaneId === pane.id;
                return (
                  <React.Fragment key={pane.id}>
                    {idx > 0 && <div className="w-px h-full bg-[#30363d] shrink-0" />}
                    
                    <div
                      className={`flex-1 font-mono text-[13px] text-[#cccccc] overflow-y-auto custom-scrollbar selection:bg-[#204060] cursor-text select-text transition-colors ${isActivePane ? 'bg-[#0d1117]' : 'bg-[#090c10]'}`}
                      style={{ paddingLeft: "15px", paddingTop: "10px", paddingRight: "15px", paddingBottom: "15px" }}
                      onClick={() => setActivePaneId(pane.id)}
                    >
                      <div className="flex flex-col leading-[24px] tracking-[0.2px]">
                        {pane.history.map((line, i) => (
                          <span key={i} className={`whitespace-pre-wrap break-all ${line.startsWith("<Error>") ? "text-[#f85149]" : ""}`}>{line}</span>
                        ))}
                        <div className="flex items-center">
                          <span className="shrink-0 text-[#3fb950]" style={{ marginRight: "8px" }}>PS C:\Users\CComp\Workspace&gt;</span>
                          <input
                            type="text"
                            value={pane.input}
                            onChange={(e) => setPaneInput(activeSession.id, pane.id, e.target.value)}
                            onKeyDown={(e) => handleCommandExecute(e, activeSession.id, pane.id, pane.input)}
                            className="flex-1 bg-transparent outline-none border-none text-[#cccccc] caret-[#c9d1d9] h-[24px]"
                            autoFocus={isActivePane}
                            spellCheck={false}
                          />
                        </div>
                        {isActivePane && <div ref={terminalEndRef} className="h-4" />}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* SIDEBAR TERMINAL KANAN */}
            <div className="w-[220px] border-l border-[#21262d] bg-[#161b22] flex flex-col shrink-0 relative z-10 select-none">
              <div className="flex items-center justify-end h-[36px] px-2 border-b border-[#21262d] shrink-0" style={{ paddingRight: "10px" }}>
                <div 
                  className="relative group flex items-center justify-center cursor-pointer text-[#8b949e] hover:text-[#c9d1d9] rounded-[6px] hover:bg-[#30363d] transition-colors" 
                  style={{ padding: "8px" }} 
                  onClick={handleAddSession}
                >
                  <AddIcon />
                  <Tooltip text="New Terminal" position="left" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar py-2" style={{ paddingLeft: "10px", paddingRight: "10px", paddingTop: "10px" }}>
                {sessions.flatMap(session => {
                  const isSingle = session.panes.length === 1;
                  const isGroupActive = activeSessionId === session.id;

                  return session.panes.map((pane, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === session.panes.length - 1;
                    const isActive = isGroupActive && activePaneId === pane.id;

                    return (
                      <div 
                        key={pane.id} 
                        className="flex items-center w-full h-[32px] cursor-pointer group"
                        onClick={() => { setActiveSessionId(session.id); setActivePaneId(pane.id); }}
                      >
                        {!isSingle && (
                          isFirst ? <TreeTopBranch /> : isLast ? <TreeLastBranch /> : <TreeMiddleBranch />
                        )}
                        <div className={`flex-1 flex items-center justify-between h-[28px] px-[12px] rounded-[6px] transition-colors ${!isSingle ? 'ml-[4px]' : ''} ${isActive ? 'bg-[#2a2d32] text-[#c9d1d9]' : 'text-[#8b949e] hover:bg-[#2a2d32] hover:text-[#c9d1d9]'}`}>
                          <div className="flex items-center overflow-hidden">
                            <div className="flex items-center justify-center shrink-0">
                              <TerminalNodeIcon />
                            </div>
                            <span className="truncate text-[13px] ml-[5px]">{isSingle ? session.name : pane.name}</span>
                          </div>
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-[2px] hover:text-[#c9d1d9] hover:bg-[#454545] rounded-[4px] transition-colors" onClick={(e) => { e.stopPropagation(); handleSplitPane(session.id); }} title="Split Terminal"><SplitInlineIcon /></div>
                            <div className="p-[2px] hover:text-[#f85149] hover:bg-[#454545] rounded-[4px] transition-colors" onClick={(e) => { e.stopPropagation(); handleClosePane(session.id, pane.id); }} title="Kill Terminal"><TrashIcon /></div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </>
        )}

        {/* ================= TEST CASE DETAIL VIEW ================= */}
        {activeMenu === "test-output" && (
          <div className="flex-1 flex overflow-hidden bg-[#0d1117] w-full">
            {hasRunTests && currentTest ? (
              <>
                <div 
                  className="border-r border-[#21262d] flex flex-col shrink-0 overflow-y-auto custom-scrollbar"
                  style={{ width: "300px", paddingLeft: "24px", paddingTop: "24px", paddingRight: "24px", paddingBottom: "24px", gap: "20px" }}
                >
                  {[
                    { label: 'Status', value: 'ACCEPTED', isBadge: true },
                    { label: 'Runtime', value: '2 ms' },
                    { label: 'Memory', value: '256 KB' },
                    { label: 'Exit Code', value: '0' },
                    { label: 'Compiler', value: 'GCC 13.2.0 -O2' },
                    { label: 'Execute At', value: '14:32:11' },
                  ].map((item) => (
                    <div key={item.label} className="grid items-center text-[14px]" style={{ gridTemplateColumns: "100px 1fr" }}>
                      <span className="text-[#c9d1d9]">{item.label}</span>
                      {item.isBadge ? (
                        <div>
                          <span className="bg-[#238636]/20 text-[#3fb950] rounded-[4px] font-medium tracking-wide text-[12px] uppercase" style={{ paddingLeft: "12px", paddingRight: "12px", paddingTop: "4px", paddingBottom: "4px" }}>
                            {item.value}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#f0f6fc]">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div 
                  className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
                  style={{ paddingLeft: "24px", paddingTop: "24px", paddingRight: "24px", paddingBottom: "24px" }}
                >
                  <div style={{ display: "flex", width: "100%", marginBottom: "24px" }}>
                    <div style={{ flex: 1, marginRight: "24px", display: "flex", flexDirection: "column" }}>
                      <span className="text-[14px] text-[#f0f6fc]" style={{ marginBottom: "12px" }}>Input</span>
                      <div className="bg-[#161b22] rounded-[6px] text-[13px] text-[#c9d1d9] font-mono whitespace-pre overflow-y-auto custom-scrollbar" style={{ padding: "16px", minHeight: "50px" }}>
                        {currentTest.executedInput || <span className="text-[#8b949e] italic">Empty</span>}
                      </div>
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      <span className="text-[14px] text-[#f0f6fc]" style={{ marginBottom: "12px" }}>Expected Output</span>
                      <div className="bg-[#161b22] rounded-[6px] text-[13px] text-[#c9d1d9] font-mono whitespace-pre overflow-y-auto custom-scrollbar" style={{ padding: "16px", minHeight: "50px" }}>
                        {currentTest.executedExpected || <span className="text-[#8b949e] italic">Empty</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <span className="text-[14px] text-[#f0f6fc]" style={{ marginBottom: "12px" }}>Your Output</span>
                    <div className="bg-[#161b22] rounded-[6px] text-[13px] text-[#c9d1d9] font-mono whitespace-pre overflow-y-auto custom-scrollbar" style={{ padding: "16px", minHeight: "50px" }}>
                      {currentTest.executedExpected || <span className="text-[#8b949e] italic">Empty</span>}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[#8b949e] gap-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-[14px] font-medium text-[#c9d1d9]">No Test Cases Executed</span>
                  <span className="text-[13px] mt-1">Click the run button on your test cases to see output here.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= ANALYSIS VIEW ================= */}
        {activeMenu === "analysis" && (
          <div className="flex-1 flex overflow-hidden bg-[#0d1117] w-full">
            
            <div 
              className="border-r border-[#21262d] flex flex-col shrink-0"
              style={{ width: "450px" }}
            >
              <div className="flex justify-end border-b border-[#21262d]" style={{ padding: "10px 16px" }}>
                <div className="flex items-center bg-[#1c212b] border border-[#30363d] rounded-[4px] focus-within:border-[#3574f0] transition-colors"
                     style={{ width: "280px", paddingLeft: "12px", paddingRight: "12px", paddingTop: "6px", paddingBottom: "6px" }}>
                  <input 
                    type="text" 
                    placeholder="Filter (e.g. text, **/*.ts, !**/node...)" 
                    className="flex-1 bg-transparent border-none outline-none text-[#c9d1d9] text-[12px] placeholder-[#6e7681]"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                  <FilterIcon />
                </div>
              </div>

              <div 
                className="flex items-center text-[12px] cursor-pointer hover:bg-[#161b22] transition-colors" 
                style={{ padding: "10px 16px" }}
                onClick={() => setIsFileGroupExpanded(!isFileGroupExpanded)}
              >
                <div className={`transition-transform duration-200 ${isFileGroupExpanded ? "" : "-rotate-90"}`}>
                  <ChevronDown />
                </div>
                <span className="text-[#58a6ff] font-medium" style={{ marginLeft: "8px", marginRight: "6px" }}>TS</span>
                <span className="text-[#c9d1d9]">app.component.ts</span>
                <span className="text-[#8b949e]" style={{ marginLeft: "6px", marginRight: "8px" }}>src\app</span>
                <span className="bg-[#21262d] text-[#8b949e] rounded-full flex items-center justify-center text-[10px] w-[16px] h-[16px]">
                  {filteredIssues.length}
                </span>
              </div>

              {isFileGroupExpanded && (
                <div className="flex flex-col overflow-y-auto custom-scrollbar">
                  {filteredIssues.length > 0 ? filteredIssues.map((issue) => (
                    <div 
                      key={issue.id}
                      onClick={() => setActiveIssueId(issue.id)}
                      className="cursor-pointer transition-colors group" 
                      style={{ padding: "2px 16px" }}
                    >
                      <div className={`flex items-center px-[14px] py-[8px] rounded-[6px] border-l-[2px] transition-colors ${
                        activeIssueId === issue.id 
                          ? "bg-[#1c212b] border-[#3574f0]" 
                          : "border-transparent group-hover:bg-[#161b22]"
                      }`}>
                        <span className="shrink-0">
                          {issue.type === 'error' && <ErrorIcon />}
                          {issue.type === 'warning' && <WarningIcon />}
                          {issue.type === 'info' && <InfoIcon />}
                        </span>
                        <span className="text-[#c9d1d9] text-[13px] truncate" style={{ marginLeft: "12px", maxWidth: "240px" }}>
                          {issue.title}
                        </span>
                        <span className="text-[#8b949e] text-[12px] truncate" style={{ marginLeft: "auto" }}>
                          {issue.code} {issue.locStr}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-[12px] text-[#8b949e] italic" style={{ padding: "10px 16px" }}>No issues found matching filter.</div>
                  )}
                </div>
              )}
            </div>

            <div 
              className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#0d1117]"
              style={{ paddingLeft: "24px", paddingTop: "24px", paddingRight: "24px", paddingBottom: "24px" }}
            >
              <div className="flex items-center" style={{ marginBottom: "16px" }}>
                <div className={`flex items-center border rounded-[4px] ${
                  activeIssue.type === 'error' ? 'border-[#f85149]/30 bg-[#f85149]/10' : 
                  activeIssue.type === 'warning' ? 'border-[#d29922]/30 bg-[#d29922]/10' : 
                  'border-[#58a6ff]/30 bg-[#58a6ff]/10'
                }`} style={{ paddingLeft: "12px", paddingRight: "12px", paddingTop: "6px", paddingBottom: "6px" }}>
                  {activeIssue.type === 'error' && <ErrorIcon />}
                  {activeIssue.type === 'warning' && <WarningIcon />}
                  {activeIssue.type === 'info' && <InfoIcon />}
                  <span className={`text-[12px] font-medium ml-2 capitalize ${
                    activeIssue.type === 'error' ? 'text-[#f85149]' : 
                    activeIssue.type === 'warning' ? 'text-[#d29922]' : 
                    'text-[#58a6ff]'
                  }`} style={{ paddingLeft: "5px" }}>
                    {activeIssue.type}
                  </span>
                </div>
                <span className="text-[#f0f6fc] text-[15px] font-semibold ml-4" style={{ paddingLeft: "10px" }}>
                  {activeIssue.title}
                </span>
              </div>

              <div className="text-[13px] text-[#c9d1d9] flex items-center" style={{ marginBottom: "24px", gap: "10px" }}>
                <span>Location</span>
                <div className="w-[1px] h-[14px] bg-[#30363d] mx-3"></div>
                <span className="text-[#c9d1d9]">{activeIssue.location}</span>
              </div>

              <div className="flex flex-col" style={{ gap: "20px" }}>
                <div>
                  <span className="text-[#c9d1d9] text-[13px] mb-1 block font-medium">Why is this an issue?</span>
                  <span className="text-[#8b949e] text-[13px] leading-relaxed">{activeIssue.why}</span>
                </div>

                <div>
                  <span className="text-[#c9d1d9] text-[13px] mb-1 block font-medium">Suggestion</span>
                  <span className="text-[#8b949e] text-[13px] leading-relaxed">{activeIssue.suggestion}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[#c9d1d9] text-[13px] mb-2 block font-medium">Code Snippet</span>
                  
                  <div className="bg-[#010409] border border-[#21262d] rounded-[6px] text-[13px] font-mono flex overflow-hidden max-w-[600px]">
                    
                    <div className="flex flex-col items-end text-[#8b949e] bg-[#0d1117] border-r border-[#21262d] shrink-0" style={{ padding: "12px 12px 12px 24px", minWidth: "56px" }}>
                      <div className="leading-[24px] w-full text-right">{activeIssue.lineNum - 2}</div>
                      <div className="leading-[24px] w-full text-right">{activeIssue.lineNum - 1}</div>
                      <div className="leading-[24px] relative flex items-center justify-end w-full">
                        {activeIssue.type === 'error' && (
                          <div className="absolute flex items-center" style={{ left: "-24px" }}>
                            <ArrowRightTriangle />
                          </div>
                        )}
                        <span className={activeIssue.type === 'error' ? "text-[#c9d1d9]" : ""}>{activeIssue.lineNum}</span>
                      </div>
                      <div className="leading-[24px] w-full text-right">{activeIssue.lineNum + 1}</div>
                    </div>

                    <div className="flex flex-col flex-1" style={{ padding: "12px 16px 12px 16px" }}>
                      <div className="leading-[24px] min-h-[24px]"></div>
                      
                      <div className="leading-[24px]">
                        {activeIssue.id === "err-1" ? (
                          <>
                            <span className="text-[#58a6ff]">char</span> <span className="text-[#7ee787]">buf</span><span className="text-[#c9d1d9]">[</span><span className="text-[#ff7b72]">10</span><span className="text-[#c9d1d9]">];</span>
                          </>
                        ) : (
                          <span className="text-[#c9d1d9]">...</span>
                        )}
                      </div>
                      
                      <div className="leading-[24px] relative w-full flex items-center" style={{ marginLeft: "-16px", paddingLeft: "16px", paddingRight: "16px" }}>
                        <span 
                          className="text-[#c9d1d9]" 
                          style={{ 
                            borderBottom: `2px dotted ${
                              activeIssue.type === 'error' ? '#f85149' : 
                              activeIssue.type === 'warning' ? '#d29922' : 
                              '#58a6ff'
                            }`,
                            paddingBottom: "2px"
                          }}
                        >
                          {activeIssue.snippetCode}
                        </span> 
                        <span className="text-[#8b949e]" style={{ marginLeft: "8px" }}>{activeIssue.snippetComment}</span>
                      </div>

                      <div className="leading-[24px] min-h-[24px]"></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}