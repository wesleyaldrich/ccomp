import { useCallback, useEffect, useRef } from 'react';
import {
  Layout,
  TabNode,
  Actions,
  Action,
  Model,
  ITabRenderValues,
} from 'flexlayout-react';
import Editor from '@monaco-editor/react';
import { flexlayoutModel } from './model';
import { isDirty, useTabStore } from './useTabStore';
import { confirmCloseDirtyTab, consumeEditorFocusRequest, saveFile } from './fileActions';
import { schedulePersist } from './session';
import styles from './CodeEditor.module.css';

// Isi tab: subscribe ke store sendiri, jadi mengetik tidak me-render ulang Layout
function EditorTab({ fileId }: { fileId: string }) {
  const file = useTabStore((s) => s.openFiles.get(fileId));
  const updateContent = useTabStore((s) => s.updateContent);
  
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  
  // State untuk melacak highlight di dalam editor
  const decorationIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!file) return;

    const applyHighlight = (path: string, line: number, word: string) => {
      if (path !== file.path || !editorRef.current || !monacoRef.current) return;
      const editor = editorRef.current;
      const monaco = monacoRef.current;

      editor.revealLineInCenter(line);

      const model = editor.getModel();
      if (model) {
        const text = model.getLineContent(line);
        const col = text.toLowerCase().indexOf(word.toLowerCase()) + 1;
        
        if (col > 0) {
          // Terapkan warna kustom dari CSS, bukan selection standar biru
          decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, [
            {
              range: new monaco.Range(line, col, line, col + word.length),
              options: { inlineClassName: 'vscode-search-highlight-editor' }
            }
          ]);
          // Letakkan kursor tepat di sebelah kata
          editor.setPosition({ lineNumber: line, column: col });
        } else {
          editor.setPosition({ lineNumber: line, column: 1 });
        }
      }
      editor.focus();
    };

    const handleSearchEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { path, line, word } = customEvent.detail;
      applyHighlight(path, line, word);
    };

    window.addEventListener('ccomp:search-goto', handleSearchEvent);
    return () => window.removeEventListener('ccomp:search-goto', handleSearchEvent);
  }, [file?.path]);

  if (!file) {
    return <div style={{ color: '#aaa', padding: 16 }}>Memuat file...</div>;
  }

  return (
    <Editor
      height="100%"
      theme="ccomp-dark" // tema didefinisikan di src/monacoSetup.ts
      path={file.id} // satu model Monaco per tab: undo & posisi kursor terjaga
      language={file.language}
      value={file.content}
      onChange={(value) => updateContent(file.id, value ?? '')}
      onMount={(editor, monaco) => {
        // File yang baru dibuat dari Explorer: langsung fokus supaya bisa diketik
        if (consumeEditorFocusRequest(file.path)) editor.focus();

        const pending = (window as any).__pendingSearchJump;
        if (pending && pending.path === file.path) {
          setTimeout(() => {
            editor.revealLineInCenter(pending.line);
            const model = editor.getModel();
            if (model) {
              const text = model.getLineContent(pending.line);
              const col = text.toLowerCase().indexOf(pending.word.toLowerCase()) + 1;
              if (col > 0) {
                decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, [
                  {
                    range: new monaco.Range(pending.line, col, pending.line, col + pending.word.length),
                    options: { inlineClassName: 'vscode-search-highlight-editor' }
                  }
                ]);
                editor.setPosition({ lineNumber: pending.line, column: col });
              } else {
                editor.setPosition({ lineNumber: pending.line, column: 1 });
              }
            }
            editor.focus();
            ;(window as any).__pendingSearchJump = null;
          }, 50);
        }

        // Hapus highlight oranye saat user mengeklik tempat lain atau memindahkan panah keyboard
        editor.onDidChangeCursorPosition((e: any) => {
          if (
            decorationIdsRef.current.length > 0 && 
            e.reason === monaco.editor.CursorChangeReason.Explicit
          ) {
            decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, []);
          }
        });

        // Ctrl+S saat kursor berada di dalam editor
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          void saveFile(file.id);
        });
      }}
      options={{
        fontSize: 14,
        fontFamily: "Consolas, 'Courier New', monospace",
        automaticLayout: true,
        scrollBeyondLastLine: false,
        tabSize: 2,
        minimap: { enabled: true },
      }}
    />
  );
}

// Judul tab: nama dipotong "..." kalau kepanjangan, titik kecil kalau belum disimpan
function TabLabel({ fileId, fallback }: { fileId: string; fallback: string }) {
  const file = useTabStore((s) => s.openFiles.get(fileId));
  const dirty = file ? isDirty(file) : false;
  const title = file?.title ?? fallback;

  return (
    <span className={styles.tabLabelWrap} title={file?.path ?? title}>
      <span className={styles.tabLabel}>{title}</span>
      {dirty && <span className={styles.dirtyDot} />}
    </span>
  );
}

export default function CodeEditor() {
  const factory = useCallback((node: TabNode) => {
    if (node.getComponent() === 'editor') {
      return <EditorTab fileId={node.getId()} />;
    }
    return null;
  }, []);

  const handleRenderTab = useCallback((node: TabNode, values: ITabRenderValues) => {
    values.content = <TabLabel fileId={node.getId()} fallback={node.getName()} />;
  }, []);

  const handleAction = useCallback((action: Action) => {
    if (action.type === Actions.DELETE_TAB) {
      const id = action.data.node as string;
      const file = useTabStore.getState().openFiles.get(id);

      if (file && isDirty(file)) {
        // Batalkan penutupan sekarang, tanya dulu mau disimpan atau tidak
        void confirmCloseDirtyTab(id);
        return undefined;
      }
      useTabStore.getState().closeFile(id);
    }
    return action;
  }, []);

  const handleModelChange = useCallback((model: Model) => {
    const selected = model.getActiveTabset()?.getSelectedNode();
    if (selected) useTabStore.getState().setActiveFileId(selected.getId());
    schedulePersist();
  }, []);

  // Ctrl+S saat fokus tidak di dalam editor (misalnya habis klik file di Explorer)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const id = useTabStore.getState().activeFileId;
        if (id) void saveFile(id);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={styles['code-editor']}
      style={{ height: '100%', width: '100%', position: 'relative' }}
    >
      <div
        className={styles['menu-tabs']}
        style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0 }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          <Layout
            model={flexlayoutModel}
            factory={factory}
            onRenderTab={handleRenderTab}
            onAction={handleAction}
            onModelChange={handleModelChange}
          />
        </div>
      </div>
    </div>
  );
}
