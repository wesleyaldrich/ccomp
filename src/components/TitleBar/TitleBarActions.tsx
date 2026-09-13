import { Square, X } from "lucide-react";
import { useWindowControls } from "../../hooks/window/useWindowControls";
import styles from "./TitleBar.module.css";

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
      className={styles.windowControls}
      aria-label="Window controls"
    >
      {/* Minimize */}
      <button
        type="button"
        className={styles.windowButton}
        aria-label="Minimize window"
        title="Minimize"
        onClick={minimize}
      >
        <span
          className={styles.minimizeIcon}
          aria-hidden="true"
        >
          −
        </span>
      </button>

      {/* Maximize */}
      <button
        type="button"
        className={styles.windowButton}
        aria-label={isMaximized ? "Restore window" : "Maximize window"}
        title={isMaximized ? "Restore" : "Maximize"}
        onClick={handleMaximize}
      >
        <Square
          className={`${styles.maximizeIcon} ${isMaximized ? styles.maximizeIconMaximized : ""}`}
        />
      </button>

      {/* Close */}
      <button
        type="button"
        className={`${styles.windowButton} ${styles.windowButtonClose}`}
        aria-label="Close window"
        title="Close"
        onClick={close}
      >
        <X className={styles.closeIcon} />
      </button>
    </div>
  );
}
