import React from 'react';

interface ActivityBarProps {
    activeMenu: 'explorer' | 'settings' | null;
    setActiveMenu: (menu: 'explorer' | 'settings' | null) => void;
}

export function ActivityBar({ activeMenu, setActiveMenu }: ActivityBarProps) {
    const toggleMenu = (menu: 'explorer' | 'settings') => {
        if (activeMenu === menu) setActiveMenu(null);
        else setActiveMenu(menu);
    };

    const topMenus = [
        { id: 'explorer', name: 'Explorer' },
        { id: 'search', name: 'Search' },
        { id: 'extensions', name: 'Extensions' },
    ];

    const bottomMenus = [
        { id: 'code', name: 'Code' },
        { id: 'analytics', name: 'Analytics' },
        { id: 'settings', name: 'Settings' },
    ];

    const renderIcon = (menu: { id: string; name: string }) => {
        const isActive = activeMenu === menu.id;
        return (
            <button 
                key={menu.id}
                onClick={() => (menu.id === 'explorer' || menu.id === 'settings') ? toggleMenu(menu.id as any) : null}
                className={`w-[50px] h-[50px] flex shrink-0 items-center justify-center rounded-xl outline-none cursor-pointer border-none transition-all duration-200 ${
                    isActive ? 'bg-[#1c212b] opacity-100' : 'bg-transparent opacity-50 hover:opacity-100 hover:bg-[#1c212b]/50'
                }`}
            >
                <div 
                    className="flex items-center justify-center shrink-0"
                    style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px' }}
                >
                    <img 
                        src={`/src/assets/icons/${menu.id}_${isActive ? 'active_' : ''}icon.svg`} 
                        alt={menu.name} 
                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                        className="block"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                </div>
            </button>
        );
    };

    return (
        <div className="w-16 min-w-[64px] h-full bg-[#161b22] border-r border-[#21262d] flex flex-col justify-between items-center py-4 z-10 shrink-0">
            <div className="flex flex-col w-full items-center" style={{ gap: '5px', marginTop: '14px' }}>
                {topMenus.map(renderIcon)}
            </div>
            
            <div className="flex flex-col w-full items-center" style={{ gap: '5px', marginBottom: '14px' }}>
                {bottomMenus.map(renderIcon)}
            </div>
        </div>
    );
}