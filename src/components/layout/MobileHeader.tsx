import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Bell,
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  MousePointerClick,
  Clock,
  Trash2,
  Link as LinkIcon,
  FileOutput,
} from 'lucide-react';
import { CountBadge } from '../ui/CountBadge';
import { useClickNotifications } from '../../hooks/useClickNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

const menuItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/applications', icon: Briefcase, label: 'Aplikacje' },
  { to: '/interviews', icon: MessageSquare, label: 'Rozmowy' },
  { to: '/cv-generator', icon: FileOutput, label: 'Generator CV' },
  { to: '/cv', icon: FileText, label: 'Baza CV' },
  { to: '/links', icon: LinkIcon, label: 'Moje linki' },
  { to: '/settings', icon: Settings, label: 'Ustawienia' },
];

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { state, dispatch } = useApp();

  const handleNewClicks = useCallback((applicationIds: string[]) => {
    applicationIds.forEach(appId => {
      const app = state.applications.find(a => a.id === appId);
      if (app && (app.status === 'applied' || app.status === 'saved')) {
        dispatch({ type: 'UPDATE_APPLICATION', payload: { ...app, status: 'cv_viewed' } });
      }
    });
  }, [state.applications, dispatch]);

  const { notifications, unreadCount, markAllRead, dismissOne, dismissAll } = useClickNotifications(handleNewClicks);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = () => {
    setBellOpen(v => !v);
    setMenuOpen(false);
    if (unreadCount > 0) markAllRead();
  };

  const handleNotifClick = (applicationId: string) => {
    setBellOpen(false);
    navigate('/applications', { state: { openTrackingFor: applicationId } });
  };

  return (
    <div className="md:hidden flex items-center justify-between px-4 py-2 bg-dark-800 border-b border-dark-700 flex-shrink-0">
      {/* Logo */}
      <span className="text-sm font-bold text-white tracking-wide uppercase">Job Odyssey</span>

      {/* Right side: bell + hamburger */}
      <div className="flex items-center gap-1">
        {/* Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={handleBellClick}
            className="relative p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1">
                <CountBadge count={unreadCount} variant="success" size="sm" />
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {bellOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-dark-800 border border-dark-600 shadow-2xl z-[100]">
              <div className="px-4 py-2.5 border-b border-dark-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-300" />
                  <span className="text-sm font-semibold text-slate-100">Kliknięcia w CV</span>
                  {notifications.length > 0 && (
                    <span className="text-xs text-slate-400">({notifications.length})</span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={dismissAll}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-danger-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <MousePointerClick className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-400">Brak powiadomień</p>
                  </div>
                ) : (
                  notifications.map(n => {
                    const app = state.applications.find(a => a.id === n.applicationId);
                    return (
                      <div
                        key={n.id}
                        className="group flex items-start gap-3 px-4 py-3 border-b border-dark-700 hover:bg-dark-700 transition-colors cursor-pointer"
                        onClick={() => handleNotifClick(n.applicationId)}
                      >
                        <MousePointerClick className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-100 truncate">
                            {app ? `${app.companyName} — ${n.label}` : n.label}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {format(parseISO(n.clickedAt), 'd MMM, HH:mm', { locale: pl })}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismissOne(n.id); }}
                          className="flex-shrink-0 p-0.5 text-slate-600 hover:text-slate-300 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => { setMenuOpen(v => !v); setBellOpen(false); }}
            className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Slide-down menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-dark-800 border border-dark-600 shadow-2xl z-[100]">
              <nav className="py-2">
                {menuItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive ? 'bg-primary-500/10 text-primary-400' : 'text-slate-300 hover:bg-dark-700'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="border-t border-dark-700 py-2">
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  Wyloguj
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
