import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Link as LinkIcon, FileText, Briefcase, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function storageKey(userId: string) {
  return `jo-onboarding-seen-${userId}`;
}

const steps = [
  {
    icon: LinkIcon,
    label: 'Dodaj swoje linki',
    description: 'LinkedIn, GitHub, Portfolio — do śledzenia kliknięć w CV.',
    path: '/links',
  },
  {
    icon: FileText,
    label: 'Stwórz pierwsze CV',
    description: 'Wypełnij szablon i zapisz do Bazy CV.',
    path: '/cv-editor',
  },
  {
    icon: Briefcase,
    label: 'Dodaj aplikację',
    description: 'Zacznij śledzić swoje wysłane aplikacje.',
    path: '/applications',
  },
];

export function WelcomeModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    const seen = localStorage.getItem(storageKey(user.id));
    if (!seen) setVisible(true);
  }, [user]);

  const handleStart = () => {
    if (user) localStorage.setItem(storageKey(user.id), '1');
    setVisible(false);
  };

  const handleStep = (path: string) => {
    handleStart();
    navigate(path);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-dark-800 border border-dark-600 w-full max-w-md">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-primary-500/20 mx-auto mb-4">
            <Rocket className="w-6 h-6 text-primary-400" />
          </div>
          <h2 className="text-xl font-light text-white mb-1">Witaj w Job Odyssey</h2>
          <p className="text-sm text-slate-400">
            Twoje centrum zarządzania rekrutacją. Zacznij od kilku kroków:
          </p>
        </div>

        {/* Steps */}
        <div className="px-6 space-y-2 pb-6">
          {steps.map(({ icon: Icon, label, description, path }) => (
            <button
              key={path}
              onClick={() => handleStep(path)}
              className="w-full flex items-start gap-3 p-3 bg-dark-700 hover:bg-dark-600 text-left transition-colors cursor-pointer group"
            >
              <div className="flex-shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center bg-primary-500/10 group-hover:bg-primary-500/20 transition-colors">
                <Icon className="w-4 h-4 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition-colors flex-shrink-0 mt-1" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleStart}
            className="w-full py-2.5 text-sm font-medium bg-primary-500 hover:bg-primary-400 text-slate-900 transition-colors cursor-pointer"
          >
            Zaczynamy
          </button>
          <p className="text-center text-xs text-slate-600 mt-2">
            Możesz też po prostu eksplorować aplikację samodzielnie.
          </p>
        </div>
      </div>
    </div>
  );
}
