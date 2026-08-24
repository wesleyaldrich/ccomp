import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

export function useWindowControls() {
  const minimize = async (): Promise<void> => {
    await appWindow.minimize();
  };

  const toggleMaximize = async (): Promise<void> => {
    await appWindow.toggleMaximize();
  };

  const close = async (): Promise<void> => {
    await appWindow.close();
  };

  const isMaximized = async (): Promise<boolean> => {
    return appWindow.isMaximized();
  };

  return {
    minimize,
    toggleMaximize,
    close,
    isMaximized,
  };
}