import { ReactNode } from 'react';
import { ApplicationStatus, InterviewStatus } from '../../types';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const variants = {
    default: 'bg-dark-700 text-slate-300',
    success: 'bg-success-500/20 text-success-400',
    warning: 'bg-warning-500/20 text-warning-400',
    danger: 'bg-danger-500/20 text-danger-400',
    info: 'bg-primary-500/20 text-primary-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium tracking-wide ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
}

// Helper do mapowania statusów aplikacji na badge
export function getStatusBadgeVariant(
  status: ApplicationStatus
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<ApplicationStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    saved: 'default',
    applied: 'info',
    interview: 'warning',
    pending: 'warning',
    rejected_no_interview: 'danger',
    rejected_after_interview: 'danger',
    offer_declined: 'default',
    withdrawn: 'default',
    success: 'success',
  };
  return map[status];
}

export function getStatusLabel(status: ApplicationStatus): string {
  const labels: Record<ApplicationStatus, string> = {
    saved: 'Zapisana',
    applied: 'Wysłana',
    interview: 'Zaproszenie',
    pending: 'Oczekiwanie',
    rejected_no_interview: 'Odmowa',
    rejected_after_interview: 'Odmowa po rozmowie',
    offer_declined: 'Odrzuciłem ofertę',
    withdrawn: 'Wycofana',
    success: 'Sukces',
  };
  return labels[status];
}

// Helper do mapowania statusów rozmów na badge
export function getInterviewStatusBadgeVariant(
  status: InterviewStatus
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<InterviewStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    scheduled: 'info',
    waiting: 'warning',
    positive: 'success',
    negative: 'danger',
  };
  return map[status];
}

export function getInterviewStatusLabel(status: InterviewStatus): string {
  const labels: Record<InterviewStatus, string> = {
    scheduled: 'Zaplanowana',
    waiting: 'Oczekiwanie',
    positive: 'Pozytywna',
    negative: 'Negatywna',
  };
  return labels[status];
}
