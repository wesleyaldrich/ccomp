import { useCallback, useEffect, useRef } from 'react';
import {
  Layout,
  TabNode,
  TabSetNode,
  BorderNode,
  Actions,
  Action,
  Model,
  ITabRenderValues,
  ITabSetRenderValues,
} from 'flexlayout-react';
import Editor from '@monaco-editor/react';
import { flexlayoutModel } from './model';
import { FileIcon } from '../SidebarLeft/FileIcon';
import { isDirty, useTabStore } from './useTabStore';
import { confirmCloseDirtyTab, consumeEditorFocusRequest, saveFile } from './fileActions';
import { schedulePersist } from './session';
import styles from './CodeEditor.module.css';
import { invoke } from '@tauri-apps/api/core';

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
      onChange={(value) => {
      const content = value ?? '';

      console.log('[EDITOR] Isi berubah:', {
        id: file.id,
        title: file.title,
        contentLength: content.length,
      });

      updateContent(file.id, content);

      const storedFile = useTabStore
        .getState()
        .openFiles.get(file.id);

      console.log('[STORE] Setelah updateContent:', {
        id: file.id,
        contentLength: storedFile?.content.length,
      });
    }}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
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
        // Ambil ID aktif saat shortcut ditekan, bukan ID file yang tertangkap saat onMount.
        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
          () => {
            const state = useTabStore.getState();
            const id = state.activeFileId;

            if (!id) return;

            const activeFile = state.openFiles.get(id);
            if (!activeFile) return;
            void saveFile(id);
          },
        );
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

// Judul tab: ikon file, nama file, dan penanda belum disimpan
function TabLabel({
  fileId,
  fallback,
}: {
  fileId: string;
  fallback: string;
}) {
  const file = useTabStore((s) => s.openFiles.get(fileId));

  const dirty = file ? isDirty(file) : false;
  const title = file?.title ?? fallback;

  // Gunakan nama file asli untuk menentukan ikon.
  // Mendukung pemisah path Windows (\) maupun Unix (/).
  const fileName = file?.path
    ? file.path.split(/[\\/]/).pop() || title
    : title;

  return (
    <span
      className={styles.tabLabelWrap}
      title={file?.path ?? title}
    >
      <span className={styles.tabIcon}>
        <FileIcon fileName={fileName} isDir={false} />
      </span>

      <span className={styles.tabLabel}>
        {title}
      </span>

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

  const handleRenderTabSet = useCallback((
    node: TabSetNode | BorderNode,
    renderValues: ITabSetRenderValues
  ) => {
    console.log('TABSET CALLBACK FIRED', node.getId());
    console.log('Render values:', renderValues);

    renderValues.buttons.push(
      <button
        key="run"
        className={styles.runButton}
        onClick={handleRun}
      >
        Run
      </button>
          );
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

  const handleRun = async () => {
    const { activeFileId, openFiles } = useTabStore.getState();

    if (!activeFileId) {
      console.log('No active file.');
      return;
    }

    const file = openFiles.get(activeFileId);

    if (!file) {
      console.log('Active file not found.');
      return;
    }

    if (!file.path) {
      console.log('Please save the file before running.');
      return;
    }

    const result = await invoke<string>('run_code', {
      filePath: file.path,
    });

    console.log(result);
  };

  // Ctrl+S saat fokus tidak di dalam editor (misalnya habis klik file di Explorer)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const id = useTabStore.getState().activeFileId;

        console.log('[SAVE SOURCE] Window:', {
          activeFileId: id,
          title: id
            ? useTabStore.getState().openFiles.get(id)?.title
            : null,
        });

        if (id) {
          void saveFile(id);
        }
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
      <div className={styles['menu-top']}>
      </div>

      <div
        className={styles['menu-tabs']}
        style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0 }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          <Layout
            model={flexlayoutModel}
            factory={factory}
            onRenderTab={handleRenderTab}
            onRenderTabSet={handleRenderTabSet}
            onAction={handleAction}
            onModelChange={handleModelChange}
          />
        </div>
      </div>
    </div>
  );
}