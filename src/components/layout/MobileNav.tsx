import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, MessageSquare, FileText } from 'lucide-react';

const mobileNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/applications', icon: Briefcase, label: 'Aplikacje' },
  { to: '/interviews', icon: MessageSquare, label: 'Rozmowy' },
  { to: '/cv', icon: FileText, label: 'Baza CV' },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 flex md:hidden z-50">
      {mobileNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              isActive ? 'text-primary-400' : 'text-slate-400'
            }`
          }
        >
          <item.icon className="w-5 h-5" />
          <span className="text-xs">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
