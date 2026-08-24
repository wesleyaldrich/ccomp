import { Square, X } from "lucide-react";
import { useWindowControls } from "../../hooks/window/useWindowControls";

interface TitleBarActionsProps {
  isMaximized: boolean;
  onMaximizeChange: () => void;
}

export function TitleBarActions({
  isMaximized,
  onMaximizeChange,
}: TitleBarActionsProps) {
  const { minimize, toggleMaximize, close } = useWindowControls();

  const handleMaximize = async (): Promise<void> => {
    await toggleMaximize();
    onMaximizeChange();
  };

  return (
    <div
      className="titlebar__window-controls"
      aria-label="Window controls"
    >
      {/* Minimize */}
      <button
        type="button"
        className="titlebar__window-button"
        aria-label="Minimize window"
        title="Minimize"
        onClick={minimize}
      >
        <span
          className="titlebar__minimize-icon"
          aria-hidden="true"
        >
          −
        </span>
      </button>

      {/* Maximize */}
      <button
        type="button"
        className="titlebar__window-button"
        aria-label={
          isMaximized
            ? "Restore window"
            : "Maximize window"
        }
        title={
          isMaximized
            ? "Restore"
            : "Maximize"
        }
        onClick={handleMaximize}
      >
        <Square
          className={`titlebar__maximize-icon ${
            isMaximized ? "titlebar__maximize-icon--maximized" : ""
          }`}
        />
      </button>

      {/* Close */}
      <button
        type="button"
        className="
          titlebar__window-button
          titlebar__window-button--close
        "
        aria-label="Close window"
        title="Close"
        onClick={close}
      >
        <X className="titlebar__close-icon" />
      </button>
    </div>
  );
}
