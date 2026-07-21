import React, { useRef, useEffect } from 'react';
import Editor, { Monaco, useMonaco } from '@monaco-editor/react';
import { FileNode } from '../../core/types';

interface MainEditorProps {
  openTabs: string[];
  activeTab: string | null;
  setActiveTab: (path: string | null) => void;
  setOpenTabs: React.Dispatch<React.SetStateAction<string[]>>;
  mockFileSystem: FileNode[];
  activeMatch?: { line: number; column: number; endColumn: number } | null;
  onCompile?: () => void;
  onRunAll?: () => void;
  onStop?: () => void;
}

// --- Icons ---
const CompileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    <path d="M9 15l-4.5 4.5c-.8.8-2 .8-2.8 0s-.8-2 0-2.8L6.2 12"></path>
  </svg>
);
const PlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);
const StopIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
  </svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

// --- Dynamic File Icon ---
const getFileIcon = (name: string) => {
  if (name.endsWith('.c') || name.endsWith('.cpp')) {
    return <span style={{ color: '#3178c6', fontWeight: 'bold', fontSize: '14px', lineHeight: 1, flexShrink: 0 }}>C</span>;
  }
  if (name.endsWith('.ts') || name.endsWith('.tsx')) {
    return <span style={{ color: '#3178c6', fontWeight: 'bold', fontSize: '12px', lineHeight: 1, flexShrink: 0 }}>TS</span>;
  }
  if (name.endsWith('.json')) {
    return <span style={{ color: '#cbcb41', fontWeight: 'bold', fontSize: '13px', lineHeight: 1, flexShrink: 0 }}>{`{}`}</span>;
  }
  if (name.endsWith('.svg')) {
    return <span style={{ color: '#a074c4', fontWeight: 'bold', fontSize: '14px', lineHeight: 1, flexShrink: 0 }}>◩</span>;
  }
  if (name.endsWith('.css')) {
    return <span style={{ color: '#519aba', fontWeight: 'bold', fontSize: '14px', lineHeight: 1, flexShrink: 0 }}>#</span>;
  }
  if (name.endsWith('.html') || name.endsWith('.htm')) {
    return <span style={{ color: '#e34c26', fontWeight: 'bold', fontSize: '14px', lineHeight: 1, flexShrink: 0 }}>&lt;&gt;</span>;
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ color: '#8b949e', flexShrink: 0 }}>
      <path d="M13 4.5l-3-3H3v13h10V4.5zM9.5 2.5L12 5H9.5V2.5zM4 13.5v-11h4.5V6H12v7.5H4z"/>
    </svg>
  );
};

const getLanguageFromPath = (path: string) => {
  const extension = path.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'c':
      return 'c';
    case 'cpp':
    case 'h':
    case 'hpp':
      return 'cpp';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'md':
      return 'markdown';
    case 'xml':
      return 'xml';
    default:
      return 'plaintext';
  }
};

export function MainEditor({ 
  openTabs, 
  activeTab, 
  setActiveTab, 
  setOpenTabs, 
  mockFileSystem, 
  activeMatch,
  onCompile,
  onRunAll,
  onStop 
}: MainEditorProps) {
  const editorRef = useRef<any>(null);
  const monaco = useMonaco();

  // --- CUSTOM THEME MONACO ---
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('ccomp-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#0d1117',
          'editor.lineHighlightBackground': '#161b22',
        }
      });
    }
  }, [monaco]);

  const findFileContent = (path: string, nodes: FileNode[]): string => {
    for (const node of nodes) {
      if (node.path === path) return node.content || '// Empty File';
      if (node.children) {
        const content = findFileContent(path, node.children);
        if (content) return content;
      }
    }
    return '';
  };

  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remainingTabs = openTabs.filter(t => t !== path);
    setOpenTabs(remainingTabs);
    if (activeTab === path && remainingTabs.length > 0) {
      setActiveTab(remainingTabs[remainingTabs.length - 1]);
    } else if (remainingTabs.length === 0) {
      setActiveTab(null);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
  
    monaco.editor.setTheme('ccomp-dark');

    editor.addAction({
      id: 'duplicate-line-down-custom',
      label: 'Duplicate Line Down Custom',
      keybindings: [monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.DownArrow],
      run: (ed: any) => ed.trigger('keyboard', 'editor.action.copyLinesDownAction', null)
    });

    editor.addAction({
      id: 'new-file-custom',
      label: 'New File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyN],
      run: () => {
        const newFileName = `/workspace/Untitled-${Date.now()}.cpp`;
        setOpenTabs(prev => {
          if (!prev.includes(newFileName)) return [...prev, newFileName];
          return prev;
        });
        setActiveTab(newFileName);
      }
    });
  };

  // --- AUTO-SCROLL & HIGHLIGHT ---
  useEffect(() => {
    if (editorRef.current && activeMatch && activeTab) {
      setTimeout(() => {
        editorRef.current.revealLineInCenter(activeMatch.line);
        editorRef.current.setSelection({
          startLineNumber: activeMatch.line,
          startColumn: activeMatch.column,
          endLineNumber: activeMatch.line,
          endColumn: activeMatch.endColumn
        });
        editorRef.current.focus();
      }, 50);
    }
  }, [activeMatch, activeTab]);

  const currentLanguage = activeTab ? getLanguageFromPath(activeTab) : 'plaintext';

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden font-sans">
      
      {/* --- TOP BAR --- */}
      <div 
        style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          height: '48px', padding: '0 16px', borderBottom: '1px solid #21262d',
          backgroundColor: '#010409', flexShrink: 0 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#161b22', padding: '6px 12px', borderRadius: '6px', border: '1px solid #30363d', cursor: 'pointer' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3fb950', flexShrink: 0 }}></span>
          <span style={{ color: '#c9d1d9', fontSize: '13px', fontWeight: 500, lineHeight: 1 }}>Local</span>
          <span style={{ color: '#8b949e', display: 'flex' }}><ChevronDown /></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            onClick={() => onCompile ? onCompile() : alert('Tautkan onCompile di parent component!')} 
            className="hover:brightness-125 transition-colors" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#21262d', color: '#c9d1d9', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
          >
            <CompileIcon /> <span style={{ lineHeight: 1 }}>Compile</span>
          </div>
          
          <div 
            onClick={() => onRunAll ? onRunAll() : alert('Tautkan onRunAll di parent component!')} 
            className="hover:brightness-125 transition-colors" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(63, 185, 80, 0.1)', color: '#3fb950', border: '1px solid rgba(63, 185, 80, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
          >
            <PlayIcon /> <span style={{ lineHeight: 1 }}>Run All</span>
          </div>
          
          <div 
            onClick={() => onStop ? onStop() : alert('Tautkan onStop di parent component!')} 
            className="hover:brightness-125 transition-colors" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#21262d', color: '#c9d1d9', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
          >
            <StopIcon /> <span style={{ lineHeight: 1 }}>Stop</span>
          </div>
        </div>
      </div>

      {/* --- TAB HEADER AREA --- */}
      <div 
        className="custom-scrollbar"
        style={{ 
          display: 'flex', alignItems: 'flex-end', 
          height: '42px', 
          backgroundColor: '#010409', 
          overflowX: 'auto', flexShrink: 0,
          borderBottom: '1px solid #0d1117' 
        }}
      >
        {openTabs.map((tabPath) => {
          const name = tabPath.split('/').pop() || 'Untitled';
          const isActive = activeTab === tabPath;
          
          return (
            <div
              key={tabPath}
              onClick={() => setActiveTab(tabPath)}
              className="group"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 10px', 
                height: '100%', 
                backgroundColor: isActive ? '#0d1117' : '#161b22', 
                color: isActive ? '#c9d1d9' : '#8b949e',
                cursor: 'pointer', flexShrink: 0, minWidth: '120px', maxWidth: '220px',
                borderRight: '1px solid #010409', 
                borderTop: isActive ? '1px solid #3fb950' : '1px solid transparent', 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', paddingRight: '4px' }}>
                {getFileIcon(name)}
                <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 2 }} title={name}>
                  {name}
                </span>
              </div>
              
              <div 
                onClick={(e) => closeTab(tabPath, e)}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  width: '20px', height: '20px', borderRadius: '4px', 
                  opacity: isActive ? 1 : 0, 
                  color: '#8b949e', flexShrink: 0, fontSize: '14px',
                  transition: 'opacity 0.2s ease, background-color 0.2s ease'
                }}
                className={`hover:bg-[#30363d] hover:text-[#c9d1d9] group-hover:opacity-100 ${isActive ? 'opacity-100' : ''}`}
                title="Close"
              >
                ✕
              </div>
            </div>
          );
        })}
      </div>

      {/* --- EDITOR CANVAS --- */}
      <div style={{ flex: 1, width: '100%', backgroundColor: '#0d1117', position: 'relative' }}>
        {activeTab ? (
          <Editor
            height="100%"
            language={currentLanguage}
            value={findFileContent(activeTab, mockFileSystem)}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 14,
              fontFamily: 'Fira Code, Consolas, monospace',
              minimap: { enabled: false },
              automaticLayout: true,
              cursorBlinking: 'smooth',
              wordWrap: 'on',
              lineHeight: 24,
              padding: { top: 0 },
              scrollbar: { vertical: 'visible', horizontal: 'visible' },
              renderLineHighlight: 'all'
            }}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', fontSize: '14px', backgroundColor: '#0d1117' }}>
            Select a file from explorer to edit code
          </div>
        )}
      </div>
    </div>
  );
}