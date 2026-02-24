import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  BarChart3,
  PieChart,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Card, CardBody, Badge, getStatusBadgeVariant, getStatusLabel, getInterviewStatusLabel } from '../components/ui';
import { format, isAfter, parseISO, isToday } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ApplicationStatus, InterviewStatus } from '../types';

export function DashboardPage() {
  const { state } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Aktualizacja zegara co sekundę
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rozmowy zaplanowane na dziś
  const todaysInterviews = useMemo(() => {
    return state.interviews.filter(
      (i) => i.status === 'scheduled' && isToday(parseISO(i.scheduledDate))
    );
  }, [state.interviews]);

  // Najbliższa zaplanowana rozmowa (jeśli nie ma dziś)
  const nextInterview = useMemo(() => {
    if (todaysInterviews.length > 0) return null;
    const now = new Date();
    const upcoming = state.interviews
      .filter((i) => i.status === 'scheduled' && isAfter(parseISO(i.scheduledDate), now))
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    return upcoming[0] || null;
  }, [state.interviews, todaysInterviews]);

  const stats = useMemo(() => {
    const now = new Date();
    // Aktywne = wysłane lub na etapie rozmów / oczekiwania
    const activeStatuses = ['applied', 'interview', 'pending'];

    const totalApplications = state.applications.length;
    const activeApplications = state.applications.filter((a) =>
      activeStatuses.includes(a.status)
    ).length;
    const successes = state.applications.filter((a) => a.status === 'success').length;

    const upcomingInterviews = state.interviews.filter(
      (i) => i.status === 'scheduled' && isAfter(parseISO(i.scheduledDate), now)
    ).length;

    const completedInterviews = state.interviews.filter(
      (i) => i.status !== 'scheduled'
    ).length;

    const responseRate =
      totalApplications > 0
        ? Math.round(
            ((state.applications.filter((a) => a.status !== 'applied' && a.status !== 'saved').length) /
              totalApplications) *
              100
          )
        : 0;

    return {
      totalApplications,
      activeApplications,
      successes,
      upcomingInterviews,
      completedInterviews,
      responseRate,
    };
  }, [state.applications, state.interviews]);

  const recentApplications = useMemo(() => {
    return [...state.applications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [state.applications]);

  const upcomingInterviews = useMemo(() => {
    const now = new Date();
    return state.interviews
      .filter((i) => i.status === 'scheduled' && isAfter(parseISO(i.scheduledDate), now))
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 5);
  }, [state.interviews]);

  // Dane do wykresu aplikacji według statusu
  const applicationsByStatus = useMemo(() => {
    const statuses: ApplicationStatus[] = [
      'saved', 'applied', 'interview', 'pending',
      'rejected_no_interview', 'rejected_after_interview',
      'offer_declined', 'withdrawn', 'success',
    ];
    const colors: Record<ApplicationStatus, string> = {
      saved: 'bg-slate-500',
      applied: 'bg-primary-500',
      interview: 'bg-warning-500',
      pending: 'bg-yellow-600',
      rejected_no_interview: 'bg-danger-500',
      rejected_after_interview: 'bg-danger-400',
      offer_declined: 'bg-slate-400',
      withdrawn: 'bg-slate-600',
      success: 'bg-success-500',
    };
    const labels: Record<ApplicationStatus, string> = {
      saved: 'Zapisana',
      applied: 'Wysłana',
      interview: 'Zaproszenie',
      pending: 'Oczekiwanie',
      rejected_no_interview: 'Odmowa',
      rejected_after_interview: 'Odmowa po rozm.',
      offer_declined: 'Odrzuciłem',
      withdrawn: 'Wycofana',
      success: 'Sukces',
    };

    return statuses.map(status => ({
      status,
      label: labels[status],
      count: state.applications.filter(a => a.status === status).length,
      color: colors[status],
    }));
  }, [state.applications]);

  // Dane do wykresu rozmów według statusu
  const interviewsByStatus = useMemo(() => {
    const statuses: InterviewStatus[] = ['scheduled', 'waiting', 'positive', 'negative'];
    const colors: Record<InterviewStatus, string> = {
      scheduled: 'bg-primary-500',
      waiting: 'bg-warning-500',
      positive: 'bg-success-500',
      negative: 'bg-danger-500',
    };

    return statuses.map(status => ({
      status,
      label: getInterviewStatusLabel(status),
      count: state.interviews.filter(i => i.status === status).length,
      color: colors[status],
    }));
  }, [state.interviews]);

  const maxApplicationCount = Math.max(...applicationsByStatus.map(s => s.count), 1);
  const maxInterviewCount = Math.max(...interviewsByStatus.map(s => s.count), 1);

  return (
    <div className="space-y-8">
      {/* Header z datą i zegarem */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 uppercase tracking-wide">Dashboard</h1>
          <p className="text-slate-400 mt-2">Przegląd Twojej podróży rekrutacyjnej</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-100 font-mono">
            {format(currentTime, 'HH:mm:ss')}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {format(currentTime, 'EEEE, d MMMM yyyy', { locale: pl })}
          </p>
        </div>
      </div>

      {/* Informacja o rozmowach */}
      {todaysInterviews.length > 0 ? (
        // Rozmowy dzisiaj
        <Card className="bg-warning-500/10 border border-warning-500/30">
          <CardBody className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-warning-500/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-warning-400" />
              </div>
              <div>
                <p className="font-semibold text-warning-300">
                  {todaysInterviews.length === 1
                    ? 'Masz dziś 1 rozmowę kwalifikacyjną!'
                    : `Masz dziś ${todaysInterviews.length} rozmowy kwalifikacyjne!`}
                </p>
                <div className="flex flex-wrap gap-3 mt-1">
                  {todaysInterviews.map((interview) => {
                    const app = state.applications.find((a) => a.id === interview.applicationId);
                    return (
                      <span key={interview.id} className="text-sm text-slate-400">
                        <span className="text-warning-400 font-mono">
                          {format(parseISO(interview.scheduledDate), 'HH:mm')}
                        </span>
                        {' - '}
                        {app?.companyName || 'Nieznana firma'}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            <Link
              to="/interviews"
              className="flex items-center gap-2 px-4 py-2 bg-warning-500 text-slate-900 font-medium hover:bg-warning-400 transition-colors"
            >
              Zobacz rozmowy
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardBody>
        </Card>
      ) : nextInterview ? (
        // Najbliższa rozmowa w przyszłości
        <Card className="bg-primary-500/10 border border-primary-500/30">
          <CardBody className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <p className="font-semibold text-primary-300">
                  Najbliższa rozmowa
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  <span className="text-primary-400 font-mono">
                    {format(parseISO(nextInterview.scheduledDate), 'EEEE, d MMMM', { locale: pl })}
                  </span>
                  {' o '}
                  <span className="text-primary-400 font-mono">
                    {format(parseISO(nextInterview.scheduledDate), 'HH:mm')}
                  </span>
                  {' - '}
                  {state.applications.find((a) => a.id === nextInterview.applicationId)?.companyName || 'Nieznana firma'}
                </p>
              </div>
            </div>
            <Link
              to="/interviews"
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-slate-900 font-medium hover:bg-primary-400 transition-colors"
            >
              Zobacz rozmowy
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardBody>
        </Card>
      ) : (
        // Brak zaplanowanych rozmów
        <Card className="bg-dark-800 border border-dark-700">
          <CardBody className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-dark-700 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-400">
                  Brak zaplanowanych rozmów
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Dodaj rozmowę, gdy otrzymasz zaproszenie
                </p>
              </div>
            </div>
            <Link
              to="/interviews"
              className="flex items-center gap-2 px-4 py-2 bg-dark-700 text-slate-300 font-medium hover:bg-dark-600 transition-colors"
            >
              Przejdź do rozmów
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-500/20 flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-wide">Wszystkie</p>
              <p className="text-3xl font-bold text-slate-100 font-mono">{stats.totalApplications}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-14 h-14 bg-warning-500/20 flex items-center justify-center">
              <Clock className="w-7 h-7 text-warning-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-wide">Aktywne</p>
              <p className="text-3xl font-bold text-slate-100 font-mono">{stats.activeApplications}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-14 h-14 bg-success-500/20 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-success-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-wide">Sukcesy</p>
              <p className="text-3xl font-bold text-slate-100 font-mono">{stats.successes}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-14 h-14 bg-accent-500/20 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-accent-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-wide">Response</p>
              <p className="text-3xl font-bold text-slate-100 font-mono">{stats.responseRate}%</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <Card>
          <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-100 uppercase tracking-wide">Ostatnie aplikacje</h2>
            <Link
              to="/applications"
              className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
            >
              Zobacz wszystkie <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <CardBody className="p-0">
            {recentApplications.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                Brak aplikacji. Dodaj pierwszą!
              </p>
            ) : (
              <ul className="divide-y divide-dark-600">
                {recentApplications.map((app) => (
                  <li key={app.id} className="px-6 py-4 hover:bg-dark-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-100">{app.position}</p>
                        <p className="text-sm text-slate-400">{app.companyName}</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(app.status)} size="sm">
                        {getStatusLabel(app.status)}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Upcoming Interviews */}
        <Card>
          <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-100 uppercase tracking-wide">Nadchodzące rozmowy</h2>
            <Link
              to="/interviews"
              className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
            >
              Zobacz wszystkie <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <CardBody className="p-0">
            {upcomingInterviews.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                Brak zaplanowanych rozmów
              </p>
            ) : (
              <ul className="divide-y divide-dark-600">
                {upcomingInterviews.map((interview) => {
                  const app = state.applications.find(
                    (a) => a.id === interview.applicationId
                  );
                  return (
                    <li key={interview.id} className="px-6 py-4 hover:bg-dark-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-100">
                            {app?.companyName || 'Nieznana firma'}
                          </p>
                          <p className="text-sm text-slate-400">{app?.position}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-primary-400 font-mono">
                            {format(parseISO(interview.scheduledDate), 'd MMM', {
                              locale: pl,
                            })}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {format(parseISO(interview.scheduledDate), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-800 p-6 text-center">
          <p className="text-4xl font-bold text-primary-400 font-mono">{state.cvs.length}</p>
          <p className="text-sm text-slate-400 uppercase tracking-wide mt-1">Wersji CV</p>
        </div>
        <div className="bg-dark-800 p-6 text-center">
          <p className="text-4xl font-bold text-warning-400 font-mono">{state.questions.length}</p>
          <p className="text-sm text-slate-400 uppercase tracking-wide mt-1">Pytań w bazie</p>
        </div>
        <div className="bg-dark-800 p-6 text-center">
          <p className="text-4xl font-bold text-accent-400 font-mono">{state.stories.length}</p>
          <p className="text-sm text-slate-400 uppercase tracking-wide mt-1">Historii STAR</p>
        </div>
        <div className="bg-dark-800 p-6 text-center">
          <p className="text-4xl font-bold text-success-400 font-mono">{stats.completedInterviews}</p>
          <p className="text-sm text-slate-400 uppercase tracking-wide mt-1">Odbytych rozmów</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Chart */}
        <Card>
          <div className="px-6 py-4 border-b border-dark-700 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            <h2 className="font-semibold text-slate-100 uppercase tracking-wide">Aplikacje według statusu</h2>
          </div>
          <CardBody>
            {state.applications.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                Brak danych do wyświetlenia
              </p>
            ) : (
              <div className="space-y-4">
                {applicationsByStatus.map(({ status, label, count, color }) => (
                  <div key={status} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-slate-400 truncate">{label}</div>
                    <div className="flex-1 h-8 bg-dark-700 overflow-hidden">
                      <div
                        className={`h-full ${color} transition-all duration-500 flex items-center justify-end px-2`}
                        style={{ width: `${(count / maxApplicationCount) * 100}%`, minWidth: count > 0 ? '2rem' : '0' }}
                      >
                        {count > 0 && (
                          <span className="text-xs font-bold text-white">{count}</span>
                        )}
                      </div>
                    </div>
                    {count === 0 && (
                      <span className="text-xs text-slate-500 w-8">0</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Interviews Chart */}
        <Card>
          <div className="px-6 py-4 border-b border-dark-700 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary-400" />
            <h2 className="font-semibold text-slate-100 uppercase tracking-wide">Rozmowy według statusu</h2>
          </div>
          <CardBody>
            {state.interviews.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                Brak danych do wyświetlenia
              </p>
            ) : (
              <div className="flex items-center gap-8">
                {/* Pie Chart representation */}
                <div className="relative w-40 h-40 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {(() => {
                      const total = state.interviews.length;
                      let currentOffset = 0;
                      const colors = ['#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

                      return interviewsByStatus.map((item, index) => {
                        const percentage = (item.count / total) * 100;
                        const dashArray = `${percentage} ${100 - percentage}`;
                        const offset = currentOffset;
                        currentOffset += percentage;

                        return (
                          <circle
                            key={item.status}
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="none"
                            stroke={colors[index]}
                            strokeWidth="3"
                            strokeDasharray={dashArray}
                            strokeDashoffset={-offset}
                            className="transition-all duration-500"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-100 font-mono">{state.interviews.length}</p>
                      <p className="text-xs text-slate-400">Rozmów</p>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-3">
                  {interviewsByStatus.map(({ status, label, count, color }) => (
                    <div key={status} className="flex items-center gap-3">
                      <div className={`w-4 h-4 ${color}`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-300">{label}</p>
                      </div>
                      <p className="text-lg font-bold text-slate-100 font-mono">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
