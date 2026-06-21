interface ActivityBarProps {
    activeMenu: string | null;
    setActiveMenu: (menu: string | null) => void;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (isOpen: boolean) => void;
    activeBottomMenu: string | null;
    setActiveBottomMenu: (menu: string | null) => void;
}

export function ActivityBar({ activeMenu, setActiveMenu, isSettingsOpen, setIsSettingsOpen, activeBottomMenu, setActiveBottomMenu }: ActivityBarProps) {
    const topMenus = [
        { id: 'explorer', name: 'Explorer' },
        { id: 'search', name: 'Search' }
    ];

    const bottomMenus = [
        { id: 'terminal', name: 'Terminal', targetBottomMenu: 'terminal' },
        { id: 'code', name: 'Test Output', targetBottomMenu: 'test-output' },
        { id: 'analytics', name: 'Analysis', targetBottomMenu: 'analysis' },
        { id: 'settings', name: 'Settings', isGlobalAction: true },
    ];

    const renderIcon = (menu: { id: string; name: string; isGlobalAction?: boolean; targetBottomMenu?: string }) => {
        const isActive = menu.isGlobalAction ? isSettingsOpen : 
            menu.targetBottomMenu ? activeBottomMenu === menu.targetBottomMenu : 
            activeMenu === menu.id;

        const handleClick = () => {
            if (menu.isGlobalAction) {
                setIsSettingsOpen(!isSettingsOpen);
            } else if (menu.targetBottomMenu) {
                setActiveBottomMenu(activeBottomMenu === menu.targetBottomMenu ? null : menu.targetBottomMenu);
            } else {
                setActiveMenu(activeMenu === menu.id ? null : menu.id);
            }
        };

        return (
            <div key={menu.id} className="relative group flex items-center justify-center w-full">
                <button 
                    onClick={handleClick}
                    className={`w-[50px] h-[50px] flex shrink-0 items-center justify-center !rounded-[8px] outline-none cursor-pointer border-none transition-all duration-200 ${
                        isActive ? 'bg-[#1c212b] opacity-100' : 'bg-transparent opacity-50 hover:opacity-100 hover:bg-[#1c212b]/50'
                    }`}
                    style={{ borderRadius: '8px' }}
                >
                    <div className="flex items-center justify-center shrink-0" style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px' }}>
                        <img 
                            src={`/src/assets/icons/${menu.id}_${isActive ? 'active_' : ''}icon.svg`} 
                            alt=""
                            style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                            className="block"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>
                </button>

                {/* --- TOOLTIP POPUP --- */}
                <div 
                    className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-200 pointer-events-none whitespace-nowrap z-[9999] font-sans"
                    style={{ left: '74px', top: '50%', transform: 'translateY(-50%)', backgroundColor: '#252526', color: '#cccccc', fontSize: '12px', padding: '4px 10px', borderRadius: '5px', border: '1px solid #454545', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', fontWeight: 500, letterSpacing: '0.3px', display: 'flex', alignItems: 'center' }}
                >
                    <div style={{ position: 'absolute', left: '-4px', top: '50%', marginTop: '-4px', transform: 'rotate(45deg)', width: '8px', height: '8px', backgroundColor: '#252526', borderLeft: '1px solid #454545', borderBottom: '1px solid #454545', borderTop: 'none', borderRight: 'none', borderBottomLeftRadius: '1px' }} />
                    <span style={{ position: 'relative', zIndex: 1 }}>{menu.name}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="w-16 min-w-[64px] h-full bg-[#161b22] border-r border-[#21262d] flex flex-col justify-between items-center py-4 z-50 shrink-0">
            <div className="flex flex-col w-full items-center" style={{ gap: '5px', marginTop: '14px' }}>
                {topMenus.map(renderIcon)}
            </div>
            
            <div className="flex flex-col w-full items-center" style={{ gap: '5px', marginBottom: '14px' }}>
                {bottomMenus.map(renderIcon)}
            </div>
        </div>
    );
}