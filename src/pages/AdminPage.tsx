import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { formatDistanceToNow, format, parseISO, isAfter, subDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ShieldCheck, Loader2, Users, Activity, Rocket } from 'lucide-react';
import { PageHeader, Card, CardBody, Badge } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { getAdminUsersOverview } from '../lib/adminDb';
import type { AdminUserOverview } from '../lib/adminDb';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-primary-400 flex-shrink-0" />
        <div>
          <p className="text-2xl font-mono font-bold text-slate-100">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUserOverview[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminUsersOverview()
      .then(setUsers)
      .catch(e => setError(e.message ?? 'Nie udało się pobrać danych.'));
  }, []);

  // Klientowa bramka tylko dla wygody UX — realne zabezpieczenie jest w funkcji SQL
  // (SECURITY DEFINER sprawdza e-mail po stronie bazy i zwraca puste dane dla innych).
  if (!ADMIN_EMAIL || user?.email !== ADMIN_EMAIL) {
    return <Navigate to="/" replace />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader icon={ShieldCheck} title="Panel administratora" description="Przegląd użytkowników" />
        <p className="text-sm text-danger-400 bg-danger-500/10 px-4 py-3">{error}</p>
      </div>
    );
  }

  if (!users) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
      </div>
    );
  }

  const sevenDaysAgo = subDays(new Date(), 7);
  const activeLast7Days = users.filter(u => u.last_sign_in_at && isAfter(parseISO(u.last_sign_in_at), sevenDaysAgo)).length;
  const activated = users.filter(u => u.applications_count > 0 || u.cvs_count > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader icon={ShieldCheck} title="Panel administratora" description="Przegląd użytkowników — wyłącznie zagregowane liczby, bez wglądu w treść" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Użytkowników ogółem" value={users.length} />
        <StatCard icon={Activity} label="Aktywni w ostatnich 7 dniach" value={activeLast7Days} />
        <StatCard icon={Rocket} label="Zaczęli korzystać (CV lub aplikacja)" value={activated} />
      </div>

      <Card>
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-dark-700">
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Dołączył</th>
                <th className="pb-3 pr-4">Ostatnio aktywny</th>
                <th className="pb-3 pr-4">Konto</th>
                <th className="pb-3 pr-4">Profil</th>
                <th className="pb-3 pr-4">Aplikacje</th>
                <th className="pb-3 pr-4">CV</th>
                <th className="pb-3">Rozmowy</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id} className="border-b border-dark-700/50 last:border-0">
                  <td className="py-3 pr-4 text-slate-200">{u.email}</td>
                  <td className="py-3 pr-4 text-slate-400">
                    {format(parseISO(u.created_at), 'd MMM yyyy', { locale: pl })}
                  </td>
                  <td className="py-3 pr-4 text-slate-400">
                    {u.last_sign_in_at
                      ? formatDistanceToNow(parseISO(u.last_sign_in_at), { addSuffix: true, locale: pl })
                      : '— nigdy się nie logował —'}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={u.email_confirmed ? 'success' : 'warning'} size="sm">
                      {u.email_confirmed ? 'potwierdzone' : 'niepotwierdzone'}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    {u.has_profile ? <Badge variant="info" size="sm">uzupełniony</Badge> : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-3 pr-4 font-mono text-slate-300">{u.applications_count}</td>
                  <td className="py-3 pr-4 font-mono text-slate-300">{u.cvs_count}</td>
                  <td className="py-3 font-mono text-slate-300">{u.interviews_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
