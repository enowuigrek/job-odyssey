import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  FileText,
  HelpCircle,
  BookOpen,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/applications', icon: Briefcase, label: 'Aplikacje' },
  { to: '/interviews', icon: MessageSquare, label: 'Rozmowy' },
  { to: '/cv', icon: FileText, label: 'Baza CV' },
  { to: '/questions', icon: HelpCircle, label: 'Pytania' },
  { to: '/stories', icon: BookOpen, label: 'Historie STAR' },
];


export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [labelsVisible, setLabelsVisible] = useState(true);

  // Sekwencyjna animacja tekstu
  useEffect(() => {
    if (isCollapsed) {
      setLabelsVisible(false);
    } else {
      const timer = setTimeout(() => {
        setLabelsVisible(true);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isCollapsed]);

  return (
    <aside
      className={`bg-dark-800 h-screen flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Drag region - strefa przeciągania okna nad sidebaremem (macOS semafory) */}
      <div
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        className="h-10 flex-shrink-0"
      />
      {/* Header z logo i toggle */}
      <div className="px-3 pb-6">
        <div className="flex items-start justify-between">
          {/* Logo i nazwa */}
          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${
              labelsVisible && !isCollapsed ? 'opacity-100' : 'opacity-0 w-0'
            }`}
          >
            <h1 className="text-xl font-bold text-white tracking-wide whitespace-nowrap uppercase">
              Job Odyssey
            </h1>
            <p className="text-xs text-primary-400 uppercase tracking-widest mt-0.5">
              Career Tracker
            </p>
          </div>

          {/* Toggle button - wyrównany do góry, no-drag żeby był klikalny w strefie przeciągania */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            className={`p-1.5 text-slate-400 hover:text-white hover:bg-dark-700 transition-colors cursor-pointer ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? 'Rozwiń menu' : 'Zwiń menu'}
          >
            {isCollapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation - flex-1 aby zajęło dostępne miejsce */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center py-2.5 transition-all ${
                    isCollapsed ? 'justify-center px-2' : 'px-3'
                  } ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-slate-300 hover:text-white hover:bg-dark-700'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span
                  className={`font-medium whitespace-nowrap transition-all duration-200 ease-in-out overflow-hidden ${
                    labelsVisible && !isCollapsed ? 'opacity-100 ml-3' : 'opacity-0 w-0 ml-0'
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer - Settings zawsze widoczne na dole */}
      <div className="px-2 py-3 border-t border-dark-700 flex-shrink-0">
        <NavLink
          to="/settings"
          title={isCollapsed ? 'Ustawienia' : undefined}
          className={({ isActive }) =>
            `flex items-center py-2.5 transition-all ${
              isCollapsed ? 'justify-center px-2' : 'px-3'
            } ${
              isActive
                ? 'bg-primary-500/10 text-primary-400'
                : 'text-slate-300 hover:text-white hover:bg-dark-700'
            }`
          }
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span
            className={`font-medium whitespace-nowrap transition-all duration-200 ease-in-out overflow-hidden ${
              labelsVisible && !isCollapsed ? 'opacity-100 ml-3' : 'opacity-0 w-0 ml-0'
            }`}
          >
            Ustawienia
          </span>
        </NavLink>
      </div>
    </aside>
  );
}
