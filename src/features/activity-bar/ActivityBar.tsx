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

  return (
    <div className="w-14 bg-[#161b22] border-r border-[#21262d] flex flex-col justify-between items-center py-4">
      <div className="flex flex-col space-y-4 w-full items-center">
        {/* Explorer Icon Button */}
        <button 
          onClick={() => toggleMenu('explorer')}
          className={`p-2 rounded-lg transition-colors ${activeMenu === 'explorer' ? 'bg-[#21262d]' : 'hover:bg-[#21262d]'}`}
        >
          <img 
            src={`/src/assets/icons/${activeMenu === 'explorer' ? 'explorer_active_icon.svg' : 'explorer_icon.svg'}`} 
            alt="Explorer" 
            className="w-6 h-6"
            onError={(e) => {
              e.currentTarget.src = "https://api.iconify.design/codicon:files.svg?color=%238b949e";
            }}
          />
        </button>
      </div>

      {/* Settings Bottom Icon */}
      <button 
        onClick={() => toggleMenu('settings')}
        className={`p-2 rounded-lg transition-colors ${activeMenu === 'settings' ? 'bg-[#21262d]' : 'hover:bg-[#21262d]'}`}
      >
        <img 
          src={`/src/assets/icons/${activeMenu === 'settings' ? 'settings_active_icon.svg' : 'settings_icon.svg'}`} 
          alt="Settings" 
          className="w-6 h-6"
          onError={(e) => {
            e.currentTarget.src = "https://api.iconify.design/codicon:settings-gear.svg?color=%238b949e";
          }}
        />
      </button>
    </div>
  );
}