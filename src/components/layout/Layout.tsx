import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { MobileHeader } from './MobileHeader';

const dragStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties;

export function Layout() {
  const location = useLocation();

  // Pages that have their own FAB (add button)
  const fabPages: Record<string, { label: string; path?: string }> = {
    '/applications': { label: '+ Nowa aplikacja' },
    '/interviews': { label: '+ Nowa rozmowa' },
    '/cv': { label: '+ Nowe CV' },
  };
  const currentFab = fabPages[location.pathname];

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Sidebar - tylko desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Titlebar drag region - Electron, tylko desktop */}
        <div style={dragStyle} className="h-10 flex-shrink-0 hidden md:block" />
        {/* Mobile header z hamburger + bell */}
        <MobileHeader />
        {/* pb-20 na mobile zostawia miejsce dla bottom nav */}
        <div className="flex-1 overflow-auto p-4 pt-2 md:p-8 md:pt-0 md:pb-8 pb-24">
          <Outlet />
        </div>
      </main>
      {/* Mobile FAB — fixed nad bottom nav */}
      {currentFab && (
        <button
          onClick={() => {
            // Dispatch custom event that pages listen for
            window.dispatchEvent(new CustomEvent('fab-click', { detail: location.pathname }));
          }}
          className="md:hidden fixed bottom-16 right-4 z-50 bg-primary-500 text-slate-900 px-4 py-2.5 shadow-lg shadow-primary-500/30 text-sm font-medium active:scale-95 transition-transform cursor-pointer"
        >
          {currentFab.label}
        </button>
      )}
      {/* Mobile bottom nav - ukryta na md+ */}
      <MobileNav />
    </div>
  );
}
