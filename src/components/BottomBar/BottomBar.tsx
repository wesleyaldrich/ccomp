import { useState } from 'react';
import styles from './BottomBar.module.css'

function BottomBar() {

    /* The current active menu */
    const [activeMenu, setActiveMenu] = useState<string | null>("example")

    /* Adjustable bottom bar height */
    const [bottomBarHeight, setBottomBarHeight] = useState(260)

    /*  This method handles the logic to correctly handle
        active state when toggling between menus. */
    // @ts-ignore
    function toggleState(menu: string) {
        setActiveMenu(current =>
            current === menu ? null : menu
        )
    }

    const MIN_HEIGHT = 80
    const MAX_HEIGHT = 400
    function handleResizeStart(event: React.PointerEvent<HTMLDivElement>) {
        event.currentTarget.setPointerCapture(event.pointerId)

        const startY = event.clientY
        const startHeight = bottomBarHeight

        function handleResize(event: PointerEvent) {
            const delta = startY - event.clientY

            const newHeight = Math.min(
                MAX_HEIGHT,
                Math.max(MIN_HEIGHT, startHeight + delta)
            )

            setBottomBarHeight(newHeight)
        }

        function handleResizeEnd() {
            window.removeEventListener("pointermove", handleResize)
            window.removeEventListener("pointerup", handleResizeEnd)
        }

        window.addEventListener("pointermove", handleResize)
        window.addEventListener("pointerup", handleResizeEnd)
    }

    return (
        <>
            {/* The menu views when any menu is active */}
            {activeMenu !== null && (
                <div className={styles["bottom-bar"]} style={{ height: bottomBarHeight }}>
                    {/* Sidebar resize handler */}
                    <div
                        className={styles["resize-handle"]}
                        onPointerDown={handleResizeStart}
                    />
                    <div className={styles["header"]}>

                    </div>
                    <div className={styles["content"]}>
                        
                    </div>
                </div>
            )}
        </>
    )
}

export default BottomBar;
