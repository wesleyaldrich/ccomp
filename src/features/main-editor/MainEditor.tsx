import React from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { FileNode } from '../../core/types';

interface MainEditorProps {
  openTabs: string[];
  activeTab: string | null;
  setActiveTab: (path: string | null) => void;
  setOpenTabs: React.Dispatch<React.SetStateAction<string[]>>;
  mockFileSystem: FileNode[];
}

export function MainEditor({ openTabs, activeTab, setActiveTab, setOpenTabs, mockFileSystem }: MainEditorProps) {
  
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
    editor.addAction({
      id: 'duplicate-line-down-custom',
      label: 'Duplicate Line Down Custom',
      keybindings: [monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.DownArrow],
      run: (ed: any) => {
        ed.trigger('keyboard', 'editor.action.copyLinesDownAction', null);
      }
    });

    monaco.languages.registerCompletionItemProvider('cpp', {
      provideCompletionItems: () => {
        return {
          suggestions: [
            {
              label: 'onHargaRumahChange',
              kind: monaco.languages.CompletionItemKind.Function,
              documentation: 'Handler validasi regex input mata uang rupiah',
              insertText: 'onHargaRumahChange(event: any) {\n\tconst rawValue = event.target.value;\n\tconst nilai = rawValue.replace(/[^0-9]/g, \'\');\n}'
            }
          ]
        };
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#161b22] overflow-hidden">
      {/* Tab Header Area */}
      <div className="h-9 bg-[#0d1117] flex items-center border-b border-[#21262d] overflow-x-auto">
        {openTabs.map((tabPath) => {
          const name = tabPath.split('/').pop();
          const isActive = activeTab === tabPath;
          return (
            <div
              key={tabPath}
              onClick={() => setActiveTab(tabPath)}
              className={`h-full flex items-center space-x-2 px-4 border-r border-[#21262d] cursor-pointer text-xs transition-colors ${
                isActive ? 'bg-[#161b22] text-[#f0f6fc] border-t-2 border-blue-500' : 'bg-[#0d1117] text-[#8b949e] hover:bg-[#161b22]'
              }`}
            >
              <span>{name}</span>
              <span 
                onClick={(e) => closeTab(tabPath, e)}
                className="hover:bg-[#21262d] p-0.5 rounded text-[10px] text-gray-500 hover:text-white"
              >
                ✕
              </span>
            </div>
          );
        })}
      </div>

      {/* Editor Canvas Area */}
      <div className="flex-1 w-full">
        {activeTab ? (
          <Editor
            height="100%"
            theme="vs-dark"
            language="cpp"
            value={findFileContent(activeTab, mockFileSystem)}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 13,
              fontFamily: 'Fira Code, Menlo, Monaco, monospace',
              minimap: { enabled: true },
              automaticLayout: true,
              cursorBlinking: 'blink',
              wordWrap: 'on',
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible'
              }
            }}
          />
        ) : (
          <div className="flex-1 h-full flex items-center justify-center text-[#8b949e] text-sm">
            Select a file from explorer to edit code
          </div>
        )}
      </div>
    </div>
  );
}