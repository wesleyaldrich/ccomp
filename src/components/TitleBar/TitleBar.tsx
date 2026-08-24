import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import iconCComp from "../../../src-tauri/icons/logo_ccomp.svg";
import "./TitleBar.css";
import { TitleBarSearch } from "./TitleBarSearch";
import { TitleBarActions } from "./TitleBarActions";

function TitleBar() {
  const appWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const initializeWindowState = async (): Promise<void> => {
      setIsMaximized(await appWindow.isMaximized());

      unlisten = await appWindow.onResized(async () => {
        setIsMaximized(await appWindow.isMaximized());
      });
    };

    void initializeWindowState();

    return () => {
      unlisten?.();
    };
  }, [appWindow]);

  const handleDoubleClick = async (): Promise<void> => {
    await appWindow.toggleMaximize();

    setIsMaximized(
      await appWindow.isMaximized(),
    );
  };

  const handleSearchClick = (): void => {
  };

  return (
    <header className="titlebar">
      <div
        className="titlebar__content"
        data-tauri-drag-region
        onDoubleClick={handleDoubleClick}
      >
        <div className="titlebar__brand">
          <img
            className="titlebar__logo"
            src={iconCComp}
            alt="CComp IDE"
            draggable={false}
          />

          <span className="titlebar__app-name">
            CComp IDE
          </span>
        </div>

        <TitleBarSearch
          onClick={handleSearchClick}
        />
      </div>

      <TitleBarActions
        isMaximized={isMaximized}
        onMaximizeChange={() => {
          void appWindow
            .isMaximized()
            .then(setIsMaximized);
        }}
      />
    </header>
  );
}

export default TitleBar;
