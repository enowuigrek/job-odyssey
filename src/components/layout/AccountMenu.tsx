import { NavLink } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileBasics } from '../../contexts/ProfileBasicsContext';

interface AccountMenuProps {
  className?: string;
  /** Na wąskim mobile header pasuje sam avatar — nazwa zajmuje zbyt dużo miejsca obok bell/hamburger. */
  showName?: boolean;
}

/** Globalny wskaźnik zalogowanego konta — zdjęcie/inicjał + imię, link do profilu, widoczny na każdej stronie. */
export function AccountMenu({ className = '', showName = true }: AccountMenuProps) {
  const { user } = useAuth();
  const { name, photoUrl } = useProfileBasics();

  const displayName = name || user?.email?.split('@')[0] || 'Konto';

  return (
    <NavLink
      to="/profil/kontakt"
      title={displayName}
      className={({ isActive }) =>
        `flex items-center gap-2 min-w-0 px-2 py-1.5 transition-colors ${
          isActive ? 'text-primary-400' : 'text-slate-300 hover:text-white'
        } ${className}`
      }
    >
      <span className="w-8 h-8 rounded-full overflow-hidden bg-dark-700 flex-shrink-0 flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <User className="w-4 h-4 text-slate-500" />
        )}
      </span>
      {showName && <span className="text-sm font-medium truncate max-w-[140px]">{displayName}</span>}
    </NavLink>
  );
}
