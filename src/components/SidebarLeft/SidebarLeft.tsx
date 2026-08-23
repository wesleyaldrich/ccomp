import { useState } from 'react';
import styles from './SidebarLeft.module.css'
import MenuIcon from '../MenuIcon/MenuIcon';
import ExplorerIcon from '../../assets/icons/menu_explorer.svg?react'
import ExplorerIconActive from '../../assets/icons/menu_explorer_active.svg?react'

function SidebarLeft() {

    /* The current active menu */
    const [activeMenu, setActiveMenu] = useState<string | null>(null)

    /* Adjustable sidebar width */
    const [sidebarWidth, setSidebarWidth] = useState(220)

    /*  This method handles the logic to correctly handle
        active state when toggling between menus. */
    function toggleMenu(menu: string) {
        setActiveMenu(current =>
            current === menu ? null : menu
        )
    }

    const MIN_WIDTH = 180
    const MAX_WIDTH = 400
    function handleResizeStart(event: React.PointerEvent<HTMLDivElement>) {
        event.currentTarget.setPointerCapture(event.pointerId)

        const startX = event.clientX
        const startWidth = sidebarWidth

        function handleResize(event: PointerEvent) {
            const delta = event.clientX - startX

            const newWidth = Math.min(
                MAX_WIDTH,
                Math.max(MIN_WIDTH, startWidth + delta)
            )

            setSidebarWidth(newWidth)
        }

        function handleResizeEnd() {
            window.removeEventListener("pointermove", handleResize)
            window.removeEventListener("pointerup", handleResizeEnd)
        }

        window.addEventListener("pointermove", handleResize)
        window.addEventListener("pointerup", handleResizeEnd)
    }

    return (
        <div className={styles["sidebar-left"]}>
            {/* List of icons on the left side of the screen */}
            <div className={styles["menu-icons"]}>
                <MenuIcon
                    icon={<ExplorerIcon />}
                    iconActive={<ExplorerIconActive />}
                    active={activeMenu === "explorer"}
                    onClick={() => toggleMenu("explorer")}
                />
            </div>

            {/* The menu views when any menu is active */}
            {activeMenu !== null && (
                <>
                    <div className={styles["menu-expanded"]} style={{ width: sidebarWidth }}>

                        {/* File Explorer menu */}
                        {activeMenu === "explorer" && (
                            <div>
                                Explorer
                            </div>
                        )}

                    </div>

                    {/* Sidebar resize handler */}
                    <div
                        className={styles["resize-handle"]}
                        onPointerDown={handleResizeStart}
                    />
                </>
            )}
        </div>
    )
}

export default SidebarLeft;
