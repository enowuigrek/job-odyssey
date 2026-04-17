import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  FileText,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Bell,
  MousePointerClick,
  Clock,
  LogOut,
  X,
  Trash2,
  User,
  FileOutput,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { CountBadge } from '../ui/CountBadge';
import { useClickNotifications } from '../../hooks/useClickNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/applications', icon: Briefcase, label: 'Aplikacje' },
  { to: '/interviews', icon: MessageSquare, label: 'Rozmowy' },
  { to: '/cv-editor', icon: FileOutput, label: 'Generator CV' },
  { to: '/cv', icon: FileText, label: 'Baza CV' },
];

const profileSubItems = [
  { hash: 'kontakt', label: 'Kontakt' },
  { hash: 'opisy', label: 'Opisy' },
  { hash: 'doswiadczenie', label: 'Doświadczenie' },
  { hash: 'projekty', label: 'Projekty' },
  { hash: 'technologie', label: 'Technologie' },
  { hash: 'wyksztalcenie', label: 'Wykształcenie' },
  { hash: 'zainteresowania', label: 'Zainteresowania' },
];

const PROFILE_EXPANDED_KEY = 'jo-sidebar-profile-expanded';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(() => {
    try { return localStorage.getItem(PROFILE_EXPANDED_KEY) === 'true'; } catch { return false; }
  });
  const notifRef = useRef<HTMLDivElement>(null);
  const { state, dispatch } = useApp();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleProfileExpanded = () => {
    setProfileExpanded(prev => {
      const next = !prev;
      try { localStorage.setItem(PROFILE_EXPANDED_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const isProfilActive = location.pathname === '/profil';

  const handleNewClicks = useCallback((applicationIds: string[]) => {
    applicationIds.forEach(appId => {
      const app = state.applications.find(a => a.id === appId);
      if (app && (app.status === 'applied' || app.status === 'saved')) {
        dispatch({ type: 'UPDATE_APPLICATION', payload: { ...app, status: 'cv_viewed' } });
      }
    });
  }, [state.applications, dispatch]);

  const { notifications, unreadCount, markAllRead, dismissOne, dismissAll } = useClickNotifications(handleNewClicks);

  useEffect(() => {
    if (isCollapsed) {
      setLabelsVisible(false);
    } else {
      const timer = setTimeout(() => setLabelsVisible(true), 250);
      return () => clearTimeout(timer);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = () => {
    setShowNotifications(prev => !prev);
    if (unreadCount > 0) markAllRead();
  };

  const handleNotifClick = (applicationId: string) => {
    setShowNotifications(false);
    // Nawiguj do aplikacji i otwórz tracking — aplikacja ma ID w URL state
    navigate('/applications', { state: { openTrackingFor: applicationId } });
  };

  const labelClass = `font-medium whitespace-nowrap transition-all duration-200 ease-in-out overflow-hidden ${
    labelsVisible && !isCollapsed ? 'opacity-100 ml-3' : 'opacity-0 w-0 ml-0'
  }`;

  return (
    <aside className={`bg-dark-800 h-screen flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Drag region */}
      <div style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} className="h-10 flex-shrink-0" />

      {/* Header */}
      <div className="px-3 pb-6">
        <div className="flex items-start justify-between">
          <div className={`overflow-hidden transition-all duration-200 ease-in-out ${labelsVisible && !isCollapsed ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <h1 className="text-xl font-bold text-white tracking-wide whitespace-nowrap uppercase">Job Odyssey</h1>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            className={`p-1.5 text-slate-400 hover:text-white hover:bg-dark-700 transition-colors cursor-pointer ${isCollapsed ? 'mx-auto' : ''}`}
          >
            {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center py-2.5 transition-all ${isCollapsed ? 'justify-center px-2' : 'px-3'} ${
                    isActive ? 'bg-primary-500/10 text-primary-400' : 'text-slate-300 hover:text-white hover:bg-dark-700'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className={labelClass}>{item.label}</span>
              </NavLink>
            </li>
          ))}

          {/* Profil kandydata — expandable */}
          <li>
            <button
              type="button"
              title={isCollapsed ? 'Profil kandydata' : undefined}
              onClick={toggleProfileExpanded}
              className={`flex items-center w-full py-2.5 transition-all ${isCollapsed ? 'justify-center px-2' : 'px-3'} ${
                isProfilActive ? 'bg-primary-500/10 text-primary-400' : 'text-slate-300 hover:text-white hover:bg-dark-700'
              } cursor-pointer`}
            >
              <User className="w-5 h-5 flex-shrink-0" />
              {labelsVisible && !isCollapsed && (
                <>
                  <span className="font-medium whitespace-nowrap transition-all duration-200 ease-in-out ml-3 flex-1 text-left">
                    Profil kandydata
                  </span>
                  {profileExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                  }
                </>
              )}
            </button>

            {/* Sub-items */}
            {profileExpanded && !isCollapsed && labelsVisible && (
              <ul className="mt-0.5 space-y-0.5">
                {profileSubItems.map(sub => (
                  <li key={sub.hash}>
                    <a
                      href={`#/profil#${sub.hash}`}
                      className="flex items-center py-1.5 pl-10 pr-3 text-xs font-light text-slate-400 hover:text-white hover:bg-dark-700 transition-colors"
                      onClick={e => {
                        e.preventDefault();
                        navigate('/profil');
                        setTimeout(() => {
                          const el = document.getElementById(sub.hash);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {sub.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-dark-700 flex-shrink-0 space-y-1">

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={handleBellClick}
            title={isCollapsed ? 'Powiadomienia' : undefined}
            className={`relative flex items-center w-full py-2.5 transition-all ${isCollapsed ? 'justify-center px-2' : 'px-3'} text-slate-300 hover:text-white hover:bg-dark-700 cursor-pointer`}
          >
            <div className="relative flex-shrink-0">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2">
                  <CountBadge count={unreadCount} variant="success" />
                </span>
              )}
            </div>
            <span className={labelClass}>Powiadomienia</span>
          </button>

          {/* Notification panel */}
          {showNotifications && (
            <div className="fixed bottom-16 left-4 w-80 bg-dark-800 border border-dark-600 shadow-2xl z-[100]">
              {/* Header */}
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
                    title="Usuń wszystkie"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Usuń wszystkie
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto">
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
                        className="flex-shrink-0 p-0.5 text-slate-600 hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Usuń"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );})

                )}
              </div>

            </div>
          )}
        </div>

        {/* Settings */}
        <NavLink
          to="/settings"
          title={isCollapsed ? 'Ustawienia' : undefined}
          className={({ isActive }) =>
            `flex items-center py-2.5 transition-all ${isCollapsed ? 'justify-center px-2' : 'px-3'} ${
              isActive ? 'bg-primary-500/10 text-primary-400' : 'text-slate-300 hover:text-white hover:bg-dark-700'
            }`
          }
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span className={labelClass}>Ustawienia</span>
        </NavLink>

        {/* Logout */}
        <button
          onClick={signOut}
          title={isCollapsed ? 'Wyloguj' : undefined}
          className={`flex items-center w-full py-2.5 transition-all ${isCollapsed ? 'justify-center px-2' : 'px-3'} text-slate-400 hover:text-danger-400 hover:bg-danger-500/10 cursor-pointer`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className={labelClass}>Wyloguj</span>
        </button>
      </div>
    </aside>
  );
}
