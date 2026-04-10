import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

const dragStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties;

export function Layout() {
  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Sidebar - tylko desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Titlebar drag region - Electron, tylko desktop */}
        <div style={dragStyle} className="h-10 flex-shrink-0 hidden md:block" />
        {/* pb-20 na mobile zostawia miejsce dla bottom nav */}
        <div className="flex-1 overflow-auto p-4 pt-4 md:p-8 md:pt-0 md:pb-8">
          <Outlet />
        </div>
      </main>
      {/* Mobile bottom nav - ukryta na md+ */}
      <MobileNav />
    </div>
  );
}
