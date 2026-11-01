import { load } from '@tauri-apps/plugin-store';
import { Actions } from 'flexlayout-react';
import { flexlayoutModel } from './model';
import { useTabStore } from './useTabStore';
import { findTabIdByPath, openFileFromDisk } from './fileActions';

const SESSION_FILE = 'ccomp_session.json';

let restored = false;
let restorePromise: Promise<void> | null = null;
let persistTimer: number | undefined;

/** Urutan tab di layar (kiri ke kanan) */
function getOrderedTabIds(): string[] {
  const ids: string[] = [];
  flexlayoutModel.visitNodes((node) => {
    if (node.getType() === 'tab') ids.push(node.getId());
  });
  return ids;
}

async function persistNow() {
  try {
    const { openFiles, activeFileId } = useTabStore.getState();

    // Hanya file yang punya path di disk yang bisa dipulihkan (Untitled tidak)
    const openPaths: string[] = [];
    for (const id of getOrderedTabIds()) {
      const path = openFiles.get(id)?.path;
      if (path) openPaths.push(path);
    }
    const activePath = activeFileId ? openFiles.get(activeFileId)?.path ?? null : null;

    const store = await load(SESSION_FILE, { autoSave: false });
    await store.set('openPaths', openPaths);
    await store.set('activePath', activePath);
    await store.save();
  } catch (err) {
    console.error('Gagal menyimpan sesi:', err);
  }
}

/** Panggil setiap kali tab berubah (buka, tutup, pindah, geser urutan) */
export function schedulePersist() {
  if (!restored) return; // jangan menimpa sesi lama sebelum proses restore selesai
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => void persistNow(), 300);
}

async function doRestore() {
  try {
    const store = await load(SESSION_FILE, { autoSave: false });
    const openPaths = (await store.get<string[]>('openPaths')) ?? [];
    const activePath = (await store.get<string | null>('activePath')) ?? null;

    for (const path of openPaths) {
      // silent: file yang sudah dihapus/dipindah dilewati tanpa popup error
      await openFileFromDisk(path, { silent: true });
    }

    if (activePath) {
      const id = findTabIdByPath(activePath);
      if (id) flexlayoutModel.doAction(Actions.selectTab(id));
    }
  } catch (err) {
    console.error('Gagal memulihkan sesi:', err);
  }
}

/** Buka kembali file yang terbuka saat app terakhir ditutup. Aman dipanggil berkali-kali. */
export function restoreSession(): Promise<void> {
  if (!restorePromise) {
    restorePromise = doRestore().finally(() => {
      restored = true;
    });
  }
  return restorePromise;
}