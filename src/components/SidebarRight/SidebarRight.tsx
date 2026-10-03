import { useState } from 'react';
import styles from './SidebarRight.module.css';
import MenuIcon from '../MenuIcon/MenuIcon';
import TestCaseIcon from '../../assets/icons/menu_testcase.svg?react';
import TestCaseIconActive from '../../assets/icons/menu_testcase_active.svg?react';
import TestCasePanel from '../../features/TestCases/TestCasePanel';

function SidebarRight() {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [sidebarWidth, setSidebarWidth] = useState(350); 

    function toggleMenu(menu: string) {
        setActiveMenu(current => (current === menu ? null : menu));
    }

    const MIN_WIDTH = 350;
    const MAX_WIDTH = 600;

    function handleResizeStart(event: React.PointerEvent<HTMLDivElement>) {
        event.currentTarget.setPointerCapture(event.pointerId);

        const startX = event.clientX;
        const startWidth = sidebarWidth;

        function handleResize(event: PointerEvent) {
            const delta = event.clientX - startX;
            const newWidth = Math.min(
                MAX_WIDTH,
                Math.max(MIN_WIDTH, startWidth - delta)
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
        <div className={styles["sidebar-right"]}>
            {activeMenu !== null && (
                <div className={styles["menu-expanded"]} style={{ width: sidebarWidth }}>
                    
                    {/* Resize handler */}
                    <div
                        className={styles["resize-handle"]}
                        onPointerDown={handleResizeStart}
                    />

                    {activeMenu === "testcases" && (
                        <TestCasePanel onClose={() => setActiveMenu(null)} />
                    )}
                </div>
            )}

            <div className={styles["menu-icons"]}>
                <MenuIcon
                    icon={<TestCaseIcon />}
                    iconActive={<TestCaseIconActive />}
                    active={activeMenu === "testcases"}
                    onClick={() => toggleMenu("testcases")}
                />
            </div>
        </div>
    );
}

export default SidebarRight;
