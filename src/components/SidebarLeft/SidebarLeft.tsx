import { useState, useEffect } from 'react';
import styles from './SidebarLeft.module.css';
import MenuIcon from '../MenuIcon/MenuIcon';
import ExplorerIcon from '../../assets/icons/menu_explorer.svg?react';
import ExplorerIconActive from '../../assets/icons/menu_explorer_active.svg?react';
import SearchIcon from '../../assets/icons/menu_search.svg?react';
import SearchIconActive from '../../assets/icons/menu_search_active.svg?react';
import TestResultIcon from '../../assets/icons/menu_test_result.svg?react';
import TestResultIconActive from '../../assets/icons/menu_test_result_active.svg?react';
import SettingsIcon from '../../assets/icons/menu_settings.svg?react';
import SettingsIconActive from '../../assets/icons/menu_settings_active.svg?react';
import { Explorer } from './Explorer';
import { GlobalSearch } from './GlobalSearch';
// Static Analysis
import { ChartNoAxesCombined } from 'lucide-react';

interface SidebarLeftProps {
  onSelectFile?: (path: string) => void;
}

function SidebarLeft({ onSelectFile }: SidebarLeftProps) {

    /* The current active menu */
    const [activeMenu, setActiveMenu] = useState<string | null>('explorer');
    
    /* Adjustable sidebar width */
    const [sidebarWidth, setSidebarWidth] = useState(220);
    const [isBottomBarOpen, setIsBottomBarOpen] = useState(false);

    // Static Analysis
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    /*  This method handles the logic to correctly handle
        active state when toggling between menus. */
    useEffect(() => {
        const handleStateChange = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const activeView = detail.activeView || 'tests';
            setIsBottomBarOpen(detail.isOpen && activeView === 'tests');
            setIsAnalysisOpen(detail.isOpen && activeView === 'analysis');
        };
        const handleSettingsStateChange = (e: Event) => {
            setIsSettingsOpen((e as CustomEvent).detail.isOpen);
        };

        window.addEventListener('onBottomBarStateChange', handleStateChange);
        window.addEventListener('onSettingsStateChange', handleSettingsStateChange);
        window.dispatchEvent(new CustomEvent('onRequestBottomBarState'));
        return () => {
            window.removeEventListener('onBottomBarStateChange', handleStateChange);
            window.removeEventListener('onSettingsStateChange', handleSettingsStateChange);
        };
    }, []);

    function toggleMenu(menu: string) {
        setActiveMenu(current => current === menu ? null : menu);
    }

    function handleToggleBottomBar() {
        window.dispatchEvent(new CustomEvent('onToggleBottomBar'));
    }

    // Static Analysis
    function handleToggleAnalysis() {
        window.dispatchEvent(new CustomEvent('onToggleAnalysis'));
    }

    function handleToggleSettings() {
        window.dispatchEvent(new CustomEvent('onToggleSettings'));
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
                    <MenuIcon
                        icon={<SearchIcon />}
                        iconActive={<SearchIconActive />}
                        active={activeMenu === "search"}
                        onClick={() => toggleMenu("search")}
                    />
                </div>

                {/* Bottom Menu */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto', marginBottom: '40px' }}>
                    <MenuIcon
                        icon={<TestResultIcon />}
                        iconActive={<TestResultIconActive />}
                        active={isBottomBarOpen && !isSettingsOpen}
                        onClick={handleToggleBottomBar}
                    />
                    <MenuIcon
                        icon={<SettingsIcon />}
                        iconActive={<SettingsIconActive />}
                        active={isSettingsOpen}
                        onClick={handleToggleSettings}
                    />
                    {/* Static Analysis */}
                    <div title="Static Analysis">
                        <MenuIcon
                            icon={<ChartNoAxesCombined size={24} style={{ color: '#ffffff' }}/>}
                            iconActive={<ChartNoAxesCombined size={24} style={{ color: 'var(--color-focus)' }} />}
                            active={isAnalysisOpen}
                            onClick={handleToggleAnalysis}
                        />
                    </div>
                </div>
                
            </div>

            {/* The menu views when any menu is active */}
            {activeMenu !== null && (
                <>
                    <div className={styles["menu-expanded"]} style={{ width: sidebarWidth }}>
                        {/* File Explorer menu */}
                        {activeMenu === 'explorer' && <Explorer onSelectFile={onSelectFile} />}
                        {activeMenu === 'search' && <GlobalSearch onSelectFile={onSelectFile} />}
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