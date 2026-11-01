import { invoke } from '@tauri-apps/api/core';
import { message, save } from '@tauri-apps/plugin-dialog';
import { Actions, DockLocation } from 'flexlayout-react';
import { flexlayoutModel } from './model';
import { TabFile, useTabStore } from './useTabStore';
import {
  basename,
  isSameOrChildPath,
  languageFromFileName,
  normalizePath,
  samePath,
} from './pathUtils';

const MAIN_TABSET_ID = 'main_tabset';

let tabCounter = 0;
let untitledCounter = 0;

function newTabId(): string {
  tabCounter += 1;
  return `tab-${Date.now().toString(36)}-${tabCounter}`;
}

/** Cari tab yang sedang membuka file dengan path tertentu */
export function findTabIdByPath(path: string): string | null {
  for (const file of useTabStore.getState().openFiles.values()) {
    if (file.path && samePath(file.path, path)) return file.id;
  }
  return null;
}

/** Daftarkan file ke store + tambahkan tab-nya ke FlexLayout */
function addTab(file: TabFile) {
  useTabStore.getState().openFile(file);
  flexlayoutModel.doAction(
    Actions.addTab(
      { type: 'tab', id: file.id, name: file.title, component: 'editor' },
      MAIN_TABSET_ID,
      DockLocation.CENTER,
      -1,
      true
    )
  );
}

/** Tutup tab tanpa konfirmasi */
export function closeTabNow(id: string) {
  useTabStore.getState().closeFile(id);
  if (flexlayoutModel.getNodeById(id)) {
    flexlayoutModel.doAction(Actions.deleteTab(id));
  }
}

/* Tab "Untitled" yang kosong dan belum pernah disentuh akan diganti saat file pertama dibuka */
function closePristineUntitled(exceptId: string) {
  for (const file of [...useTabStore.getState().openFiles.values()]) {
    if (file.id !== exceptId && !file.path && file.content === '' && file.savedContent === '') {
      closeTabNow(file.id);
    }
  }
}

/** Buat tab baru kosong (Untitled-N) */
export function createUntitledTab() {
  untitledCounter += 1;
  addTab({
    id: newTabId(),
    path: null,
    title: `Untitled-${untitledCounter}`,
    content: '',
    savedContent: '',
    language: 'c',
  });
}

const opening = new Set<string>();

/** Buka file dari disk ke tab editor. Kalau sudah terbuka, cukup pindah ke tab-nya. */
export async function openFileFromDisk(filePath: string, options?: { silent?: boolean }) {
  const existingId = findTabIdByPath(filePath);
  if (existingId) {
    flexlayoutModel.doAction(Actions.selectTab(existingId));
    return;
  }

  const key = normalizePath(filePath);
  if (opening.has(key)) return; // cegah double-click membuka dua tab
  opening.add(key);

  try {
    const content = await invoke<string>('read_file_content', { filePath });
    const title = basename(filePath);
    const id = newTabId();
    addTab({
      id,
      path: filePath,
      title,
      content,
      savedContent: content,
      language: languageFromFileName(title),
    });
    closePristineUntitled(id);
  } catch (err) {
    console.error('Gagal membuka file:', err);
    if (!options?.silent) {
      await message(String(err), { title: 'Gagal membuka file', kind: 'error' });
    }
  } finally {
    opening.delete(key);
  }
}

const saving = new Set<string>();

/** Simpan file di tab `id`. Untuk file Untitled akan muncul dialog "Save As". */
export async function saveFile(id: string): Promise<boolean> {
  const file = useTabStore.getState().openFiles.get(id);
  if (!file || saving.has(id)) return false;
  saving.add(id);

  try {
    let path = file.path;
    const isNewFile = !path;

    if (!path) {
      const chosen = await save({
        title: 'Save File',
        defaultPath: file.title,
        filters: [
          { name: 'C / C++', extensions: ['c', 'h', 'cpp', 'hpp'] },
          { name: 'All files', extensions: ['*'] },
        ],
      });
      if (!chosen) return false; // user menekan Cancel
      path = chosen;
    }

    const content = file.content; // snapshot, kalau user mengetik saat menyimpan tetap terdeteksi dirty
    await invoke('save_file_content', { filePath: path, content });

    useTabStore.getState().markSaved(id, { content, path });

    const saved = useTabStore.getState().openFiles.get(id);
    if (saved && flexlayoutModel.getNodeById(id)) {
      flexlayoutModel.doAction(Actions.renameTab(id, saved.title));
    }

    // File baru mungkin muncul di dalam workspace -> minta Explorer refresh
    if (isNewFile) window.dispatchEvent(new CustomEvent('ccomp:fs-changed'));

    return true;
  } catch (err) {
    console.error('Gagal menyimpan file:', err);
    await message(String(err), { title: 'Gagal menyimpan file', kind: 'error' });
    return false;
  } finally {
    saving.delete(id);
  }
}

const SAVE_LABEL = 'Save';
const DONT_SAVE_LABEL = "Don't Save";
const CANCEL_LABEL = 'Cancel';
const confirming = new Set<string>();

/** Dipanggil saat user menutup tab yang masih punya perubahan belum tersimpan */
export async function confirmCloseDirtyTab(id: string) {
  const file = useTabStore.getState().openFiles.get(id);
  if (!file || confirming.has(id)) return;
  confirming.add(id);

  try {
    const result = await message(
      `Do you want to save the changes you made to "${file.title}"?\n\nYour changes will be lost if you don't save them.`,
      {
        title: 'Unsaved changes',
        kind: 'warning',
        buttons: { yes: SAVE_LABEL, no: DONT_SAVE_LABEL, cancel: CANCEL_LABEL },
      }
    );

    if (result === SAVE_LABEL || result === 'Yes') {
      if (await saveFile(id)) closeTabNow(id);
    } else if (result === DONT_SAVE_LABEL || result === 'No') {
      closeTabNow(id);
    }
    // selain itu (Cancel) -> tab tetap terbuka
  } finally {
    confirming.delete(id);
  }
}

/** Dipanggil Explorer setelah file/folder dihapus: tutup tab file yang ikut terhapus */
export function closeTabsForPath(deletedPath: string) {
  for (const file of [...useTabStore.getState().openFiles.values()]) {
    if (file.path && isSameOrChildPath(file.path, deletedPath)) {
      closeTabNow(file.id);
    }
  }
}

/** Dipanggil Explorer setelah file/folder di-rename: update path & nama tab yang terdampak */
export function handlePathRenamed(oldPath: string, newPath: string) {
  const before = new Map(
    [...useTabStore.getState().openFiles].map(([id, file]) => [id, file.title])
  );

  useTabStore.getState().renamePaths(oldPath, newPath);

  for (const [id, file] of useTabStore.getState().openFiles) {
    if (before.get(id) !== file.title && flexlayoutModel.getNodeById(id)) {
      flexlayoutModel.doAction(Actions.renameTab(id, file.title));
    }
  }
}

let focusRequestPath: string | null = null;

/** Minta editor milik file ini untuk langsung fokus (kursor aktif) saat pertama kali tampil */
export function requestEditorFocus(path: string) {
  focusRequestPath = path;
}

/** Dipakai EditorTab saat Monaco selesai dibuat. true = editor ini harus fokus. */
export function consumeEditorFocusRequest(path: string | null): boolean {
  if (path && focusRequestPath && samePath(path, focusRequestPath)) {
    focusRequestPath = null;
    return true;
  }
  return false;
}