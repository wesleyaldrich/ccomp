import { useEffect } from 'react';
import { useTabStore } from '../.././components/CodeEditor/useTabStore';
import { createUntitledTab } from '../.././components/CodeEditor/fileActions';
import { restoreSession } from '../.././components/CodeEditor/session';

export function useRestoreSession() {
  useEffect(() => {
    async function restore() {
      await restoreSession();

      if (useTabStore.getState().openFiles.size === 0) {
        createUntitledTab();
      }
    }

    void restore();
  }, []);
}