export interface TrashCanMessage {
  id: number;
  value: number;
  percentage: number;
}

export type TrashStatus = 'empty' | 'medium' | 'warning' | 'critical';

export interface TrashCanState {
  id: number;
  groupName: string;
  topic: string;
  percentage: number;
  value: number;
  status: TrashStatus;
  lastUpdate: Date | null;
  connected: boolean;
  everReceived: boolean;
}

export interface DashboardStats {
  total: number;
  empty: number;
  medium: number;
  warning: number;
  critical: number;
}

export function getStatusFromPercentage(p: number): TrashStatus {
  if (p <= 30) return 'empty';
  if (p <= 70) return 'medium';
  if (p <= 90) return 'warning';
  return 'critical';
}

export function getStatusLabel(status: TrashStatus): string {
  const labels: Record<TrashStatus, string> = {
    empty: 'Pouco lixo',
    medium: 'Nível médio',
    warning: 'Quase cheia',
    critical: 'Esvaziar agora',
  };
  return labels[status];
}

export function getStatusColor(status: TrashStatus): string {
  const colors: Record<TrashStatus, string> = {
    empty: '#22c55e',
    medium: '#eab308',
    warning: '#f97316',
    critical: '#ef4444',
  };
  return colors[status];
}

export function getStatusEmoji(status: TrashStatus): string {
  const emojis: Record<TrashStatus, string> = {
    empty: '🟢',
    medium: '🟡',
    warning: '🟠',
    critical: '🔴',
  };
  return emojis[status];
}
