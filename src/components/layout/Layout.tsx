import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

const dragStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties;

export function Layout() {
  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Titlebar - strefa przeciągania okna nad contentem */}
        <div style={dragStyle} className="h-10 flex-shrink-0" />
        <div className="flex-1 overflow-auto p-8 pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
