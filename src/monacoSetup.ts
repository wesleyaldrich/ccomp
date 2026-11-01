import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import editorWorker from 'monaco-editor/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/language/json/json.worker?worker';
import tsWorker from 'monaco-editor/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') return new jsonWorker();
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  },
};

loader.config({ monaco });

/* ==========================================================
   TEMA WARNA CODE EDITOR  <-- ubah warna editor di sini
   Warna dasar disamakan dengan variabel di App.css:
     --color-surface        rgb(23, 30, 38)  = #171E26
     --color-surface-raised rgb(19, 25, 33)  = #131921
     --color-active         rgb(26, 35, 44)  = #1A232C
     --color-focus          rgb(15, 59, 182) = #0F3BB6
   ========================================================== */
monaco.editor.defineTheme('ccomp-dark', {
  base: 'vs-dark',
  inherit: true,

  // Warna teks kode (syntax highlighting). Format warna: 'RRGGBB' tanpa '#'
  rules: [
    { token: 'comment', foreground: '6A7A8C', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'C792EA' },
    { token: 'string', foreground: 'C3E88D' },
    { token: 'number', foreground: 'F78C6C' },
    { token: 'type', foreground: '82AAFF' },
    { token: 'predefined', foreground: '82AAFF' },
    { token: 'operator', foreground: '89DDFF' },
    { token: 'delimiter', foreground: '9DA7B3' },
    { token: 'identifier', foreground: 'E6EDF3' },
  ],

  // Warna elemen editor (latar, nomor baris, seleksi, kursor, dll). Format: '#RRGGBB'
  colors: {
    'editor.background': '#171E26',
    'editor.foreground': '#E6EDF3',
    'editorGutter.background': '#171E26',
    'editorLineNumber.foreground': '#687482',
    'editorLineNumber.activeForeground': '#9DA7B3',
    'editor.lineHighlightBackground': '#1A232C',
    'editor.selectionBackground': '#0F3BB66B',
    'editor.inactiveSelectionBackground': '#0F3BB633',
    'editorCursor.foreground': '#FFFFFF',
    'editorIndentGuide.background1': '#FFFFFF14',
    'editorIndentGuide.activeBackground1': '#FFFFFF33',
    'editorWidget.background': '#131921',
    'editorSuggestWidget.background': '#131921',
    'editorSuggestWidget.selectedBackground': '#1A232C',
    'scrollbarSlider.background': '#68748255',
    'scrollbarSlider.hoverBackground': '#68748288',
    'scrollbarSlider.activeBackground': '#687482AA',
    'minimap.background': '#171E26',
  },
});