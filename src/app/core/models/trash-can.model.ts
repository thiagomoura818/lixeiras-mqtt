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

export type SystemHealth = 'normal' | 'attention' | 'critical' | 'offline';

// ─── Validation ──────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  data?: TrashCanMessage;
}

export function validateMqttPayload(raw: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, reason: 'JSON inválido' };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { valid: false, reason: 'Payload deve ser um objeto JSON' };
  }

  const obj = parsed as Record<string, unknown>;

  if (!('id' in obj) || !('value' in obj) || !('percentage' in obj)) {
    return { valid: false, reason: 'Campos obrigatórios ausentes: id, value, percentage' };
  }

  if (typeof obj['id'] !== 'number' || typeof obj['value'] !== 'number' || typeof obj['percentage'] !== 'number') {
    return { valid: false, reason: 'Todos os campos devem ser numéricos' };
  }

  if (!isFinite(obj['id'] as number) || !isFinite(obj['value'] as number) || !isFinite(obj['percentage'] as number)) {
    return { valid: false, reason: 'Valores numéricos inválidos (Infinity/NaN)' };
  }

  const pct = obj['percentage'] as number;
  if (pct < 0 || pct > 100) {
    return { valid: false, reason: `percentage deve estar entre 0 e 100 (recebido: ${pct})` };
  }

  return {
    valid: true,
    data: {
      id: obj['id'] as number,
      value: obj['value'] as number,
      percentage: pct,
    },
  };
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

export function getStatusFromPercentage(p: number): TrashStatus {
  if (p <= 30) return 'empty';
  if (p <= 70) return 'medium';
  if (p <= 90) return 'warning';
  return 'critical';
}

export function getStatusLabel(status: TrashStatus): string {
  return { empty: 'Pouco lixo', medium: 'Nível médio', warning: 'Quase cheia', critical: 'Esvaziar agora' }[status];
}

export function getStatusColor(status: TrashStatus): string {
  return { empty: '#22c55e', medium: '#eab308', warning: '#f97316', critical: '#ef4444' }[status];
}

export function getStatusColorVar(status: TrashStatus): string {
  return { empty: 'var(--color-empty-light)', medium: 'var(--color-medium-light)', warning: 'var(--color-warning-light)', critical: 'var(--color-critical-light)' }[status];
}

export function getStatusEmoji(status: TrashStatus): string {
  return { empty: '🟢', medium: '🟡', warning: '🟠', critical: '🔴' }[status];
}

export function getSystemHealth(stats: DashboardStats, connected: boolean): SystemHealth {
  if (!connected) return 'offline';
  if (stats.critical > 0) return 'critical';
  if (stats.warning > 0) return 'attention';
  return 'normal';
}
