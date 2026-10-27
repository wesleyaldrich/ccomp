import { create } from 'zustand';
import {
  basename,
  isSameOrChildPath,
  languageFromFileName,
  normalizePath,
} from './pathUtils';

export interface TabFile {
  /** ID tab di FlexLayout (unik, tidak berubah walaupun file di-rename) */
  id: string;
  /** Lokasi file di disk. null = file baru yang belum pernah disimpan (Untitled) */
  path: string | null;
  title: string;
  /** Isi yang sedang ada di editor */
  content: string;
  /** Isi terakhir yang tersimpan di disk (untuk mendeteksi "belum disimpan") */
  savedContent: string;
  language: string;
}

export function isDirty(file: TabFile): boolean {
  return file.content !== file.savedContent;
}

interface TabStore {
  openFiles: Map<string, TabFile>;
  activeFileId: string | null;
  /** Path item yang di-highlight di Explorer */
  selectedPath: string | null;

  openFile: (file: TabFile) => void;
  closeFile: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  markSaved: (id: string, saved: { content: string; path: string }) => void;
  renamePaths: (oldPath: string, newPath: string) => void;
  setActiveFileId: (id: string) => void;
  setSelectedPath: (path: string | null) => void;
}

export const useTabStore = create<TabStore>((set) => ({
  openFiles: new Map(),
  activeFileId: null,
  selectedPath: null,

  openFile: (file) =>
    set((state) => {
      const newMap = new Map(state.openFiles);
      newMap.set(file.id, file);
      return {
        openFiles: newMap,
        activeFileId: file.id,
        selectedPath: file.path ?? state.selectedPath,
      };
    }),

  closeFile: (id) =>
    set((state) => {
      if (!state.openFiles.has(id)) return state;
      const newMap = new Map(state.openFiles);
      newMap.delete(id);
      return {
        openFiles: newMap,
        activeFileId: state.activeFileId === id ? null : state.activeFileId,
      };
    }),

  updateContent: (id, content) =>
    set((state) => {
      const existing = state.openFiles.get(id);
      if (!existing || existing.content === content) return state;
      const newMap = new Map(state.openFiles);
      newMap.set(id, { ...existing, content });
      return { openFiles: newMap };
    }),

  markSaved: (id, saved) =>
    set((state) => {
      const existing = state.openFiles.get(id);
      if (!existing) return state;
      const title = basename(saved.path);
      const newMap = new Map(state.openFiles);
      newMap.set(id, {
        ...existing,
        path: saved.path,
        title,
        language: languageFromFileName(title),
        savedContent: saved.content,
      });
      return { openFiles: newMap };
    }),

  // Dipanggil setelah file/folder di-rename di Explorer
  renamePaths: (oldPath, newPath) =>
    set((state) => {
      const oldNorm = normalizePath(oldPath);
      const sep = newPath.includes('\\') ? '\\' : '/';

      const remap = (p: string): string => {
        const rest = p.replace(/\\/g, '/').slice(oldNorm.length); // '' atau '/sub/file.c'
        return newPath + rest.replace(/\//g, sep);
      };

      const newMap = new Map(state.openFiles);
      let changed = false;

      for (const [id, file] of state.openFiles) {
        if (!file.path || !isSameOrChildPath(file.path, oldPath)) continue;
        const updatedPath = remap(file.path);
        const title = basename(updatedPath);
        newMap.set(id, {
          ...file,
          path: updatedPath,
          title,
          language: languageFromFileName(title),
        });
        changed = true;
      }

      const selectedPath =
        state.selectedPath && isSameOrChildPath(state.selectedPath, oldPath)
          ? remap(state.selectedPath)
          : state.selectedPath;

      return changed || selectedPath !== state.selectedPath
        ? { openFiles: newMap, selectedPath }
        : state;
    }),

  setActiveFileId: (id) =>
    set((state) => {
      if (state.activeFileId === id) return state;
      const file = state.openFiles.get(id);
      return {
        activeFileId: id,
        // Explorer ikut menandai file yang sedang aktif di tab
        selectedPath: file?.path ?? state.selectedPath,
      };
    }),

  setSelectedPath: (path) =>
    set((state) => (state.selectedPath === path ? state : { selectedPath: path })),
}));