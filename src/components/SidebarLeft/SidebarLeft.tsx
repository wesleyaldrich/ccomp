import { useState, useEffect } from 'react';
import styles from './SidebarLeft.module.css';
import MenuIcon from '../MenuIcon/MenuIcon';
import ExplorerIcon from '../../assets/icons/menu_explorer.svg?react';
import ExplorerIconActive from '../../assets/icons/menu_explorer_active.svg?react';
import TestResultIcon from '../../assets/icons/menu_test_result.svg?react';
import TestResultIconActive from '../../assets/icons/menu_test_result_active.svg?react';
import { Explorer } from './Explorer';

interface SidebarLeftProps {
  onSelectFile?: (path: string) => void;
}

function SidebarLeft({ onSelectFile }: SidebarLeftProps) {

    /* The current active menu */
    const [activeMenu, setActiveMenu] = useState<string | null>('explorer');
    
    /* Adjustable sidebar width */
    const [sidebarWidth, setSidebarWidth] = useState(220);
    const [isBottomBarOpen, setIsBottomBarOpen] = useState(false);

    /*  This method handles the logic to correctly handle
        active state when toggling between menus. */
    useEffect(() => {
        const handleStateChange = (e: Event) => {
            setIsBottomBarOpen((e as CustomEvent).detail.isOpen);
        };
        window.addEventListener('onBottomBarStateChange', handleStateChange);
        return () => window.removeEventListener('onBottomBarStateChange', handleStateChange);
    }, []);

    function toggleMenu(menu: string) {
        setActiveMenu(current => current === menu ? null : menu);
    }

    function handleToggleBottomBar() {
        window.dispatchEvent(new CustomEvent('onToggleBottomBar'));
    }

    const MIN_WIDTH = 180;
    const MAX_WIDTH = 400;

    function handleResizeStart(event: React.PointerEvent<HTMLDivElement>) {
        event.currentTarget.setPointerCapture(event.pointerId);

        const startX = event.clientX;
        const startWidth = sidebarWidth;

        function handleResize(event: PointerEvent) {
            const delta = event.clientX - startX;
            const newWidth = Math.min(
                MAX_WIDTH,
                Math.max(MIN_WIDTH, startWidth + delta)
            );
            setSidebarWidth(newWidth);
        }

        function handleResizeEnd() {
            window.removeEventListener("pointermove", handleResize);
            window.removeEventListener("pointerup", handleResizeEnd);
        }

        window.addEventListener("pointermove", handleResize);
        window.addEventListener("pointerup", handleResizeEnd);
    }

    return (
        <div className={styles["sidebar-left"]}>
            {/* List of icons on the left side of the screen */}
            <div className={styles["menu-icons"]} style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '12px' }}>
                
                {/* Top Menu */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
                    <MenuIcon
                        icon={<ExplorerIcon />}
                        iconActive={<ExplorerIconActive />}
                        active={activeMenu === "explorer"}
                        onClick={() => toggleMenu("explorer")}
                    />
                </div>

                {/* Bottom Menu */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto' }}>
                    <MenuIcon
                        icon={<TestResultIcon />}
                        iconActive={<TestResultIconActive />}
                        active={isBottomBarOpen}
                        onClick={handleToggleBottomBar}
                    />
                </div>
                
            </div>

            {/* The menu views when any menu is active */}
            {activeMenu !== null && (
                <>
                    <div className={styles["menu-expanded"]} style={{ width: sidebarWidth }}>
                        {/* File Explorer menu */}
                        {activeMenu === 'explorer' && <Explorer onSelectFile={onSelectFile} />}
                    
                    </div>

                    {/* Sidebar resize handler */}
                    <div
                        className={styles["resize-handle"]}
                        onPointerDown={handleResizeStart}
                    />
                </>
            )}
        </div>
    );
}

export default SidebarLeft;
