import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import mqtt, { MqttClient } from 'mqtt';
import {
  TrashCanState,
  DashboardStats,
  SystemHealth,
  getStatusFromPercentage,
  getSystemHealth,
  validateMqttPayload,
} from '../models/trash-can.model';

// ─── Topic Configuration ──────────────────────────────────────────────────────
// Each topic strictly accepts ONLY the matching id.
const TOPICS = [
  { topic: 'projeto/lixeiras/grupo1', groupName: 'Grupo 1', id: 1, expectedId: 1 },
  { topic: 'projeto/lixeiras/grupo2', groupName: 'Grupo 2', id: 2, expectedId: 2 },
  { topic: 'projeto/lixeiras/grupo3', groupName: 'Grupo 3', id: 3, expectedId: 3 },
];

const STORAGE_KEY = 'smartbin_state_v2';

const DEFAULT_STATE: TrashCanState[] = TOPICS.map((t) => ({
  id: t.id,
  groupName: t.groupName,
  topic: t.topic,
  percentage: 0,
  value: 0,
  status: 'empty' as const,
  lastUpdate: null,
  connected: false,
  everReceived: false,
}));

@Injectable({ providedIn: 'root' })
export class TrashCanService implements OnDestroy {
  private client: MqttClient | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageCount = 0;
  private ignoredCount = 0;

  // ─── Signals ────────────────────────────────────────────────────────────────
  readonly mqttConnected = signal<boolean>(false);
  readonly mqttConnecting = signal<boolean>(true);
  readonly mqttError = signal<string | null>(null);
  readonly mqttReconnectAttempt = signal<number>(0);

  private readonly _trashCans = signal<TrashCanState[]>(this.loadFromStorage());
  readonly trashCans = this._trashCans.asReadonly();

  readonly stats = computed<DashboardStats>(() => {
    const cans = this._trashCans();
    return {
      total: cans.length,
      empty: cans.filter((c) => c.status === 'empty').length,
      medium: cans.filter((c) => c.status === 'medium').length,
      warning: cans.filter((c) => c.status === 'warning').length,
      critical: cans.filter((c) => c.status === 'critical').length,
    };
  });

  readonly systemHealth = computed<SystemHealth>(() =>
    getSystemHealth(this.stats(), this.mqttConnected())
  );

  constructor() {
    this.connect();
  }

  // ─── Storage ─────────────────────────────────────────────────────────────────
  private loadFromStorage(): TrashCanState[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [...DEFAULT_STATE];
      const stored = JSON.parse(raw) as TrashCanState[];
      return DEFAULT_STATE.map((def) => {
        const found = stored.find((s) => s.id === def.id);
        return found
          ? { ...found, lastUpdate: found.lastUpdate ? new Date(found.lastUpdate) : null, connected: false }
          : def;
      });
    } catch {
      return [...DEFAULT_STATE];
    }
  }

  private saveToStorage(cans: TrashCanState[]): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cans)); } catch { /* ignore */ }
  }

  // ─── MQTT Connection ──────────────────────────────────────────────────────────
  private connect(): void {
    this.log('info', 'Iniciando conexão MQTT...', { broker: 'broker.hivemq.com', port: 8884 });
    this.mqttConnecting.set(true);
    this.mqttError.set(null);

    try {
      this.client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
        clientId: `smartbin_${Date.now().toString(36)}`,
        clean: true,
        connectTimeout: 12000,
        reconnectPeriod: 0, // Manual reconnect for better control
        keepalive: 60,
      });

      this.client.on('connect', () => {
        this.log('info', 'Conectado ao broker MQTT');
        this.mqttConnected.set(true);
        this.mqttConnecting.set(false);
        this.mqttError.set(null);
        this.mqttReconnectAttempt.set(0);
        this.subscribeToTopics();
        this._trashCans.update((cans) => cans.map((c) => ({ ...c, connected: true })));
      });

      this.client.on('message', (topic: string, payload: Buffer) => {
        this.handleMessage(topic, payload);
      });

      this.client.on('disconnect', () => {
        this.log('warn', 'Desconectado do broker MQTT');
        this.setOffline();
        this.scheduleReconnect();
      });

      this.client.on('offline', () => {
        this.log('warn', 'Cliente MQTT offline');
        this.setOffline();
        this.scheduleReconnect();
      });

      this.client.on('error', (err: Error) => {
        this.log('error', 'Erro MQTT', { message: err.message });
        this.mqttError.set(err.message);
        this.setOffline();
        this.scheduleReconnect();
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      this.log('error', 'Falha ao inicializar cliente MQTT', { msg });
      this.mqttError.set(msg);
      this.mqttConnecting.set(false);
      this.scheduleReconnect();
    }
  }

  private subscribeToTopics(): void {
    TOPICS.forEach((t) => {
      this.client?.subscribe(t.topic, { qos: 0 }, (err) => {
        if (err) this.log('error', `Falha ao assinar ${t.topic}`, { err: err.message });
        else this.log('info', `Assinado: ${t.topic}`);
      });
    });
  }

  private setOffline(): void {
    this.mqttConnected.set(false);
    this._trashCans.update((cans) => cans.map((c) => ({ ...c, connected: false })));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const attempt = this.mqttReconnectAttempt() + 1;
    this.mqttReconnectAttempt.set(attempt);
    const delay = Math.min(3000 * Math.pow(1.5, Math.min(attempt - 1, 6)), 30000);
    this.log('info', `Reconexão em ${(delay / 1000).toFixed(0)}s (tentativa ${attempt})`);
    this.mqttConnecting.set(true);
    this.reconnectTimer = setTimeout(() => {
      this.client?.end(true);
      this.client = null;
      this.connect();
    }, delay);
  }

  // ─── Message Handling ─────────────────────────────────────────────────────────
  private handleMessage(topic: string, payload: Buffer): void {
    const topicDef = TOPICS.find((t) => t.topic === topic);
    if (!topicDef) return;

    const raw = payload.toString();
    const result = validateMqttPayload(raw);

    if (!result.valid || !result.data) {
      this.ignoredCount++;
      this.log('warn', `Mensagem inválida em ${topic} (ignorada)`, { reason: result.reason, raw: raw.slice(0, 100) });
      return;
    }

    const msg = result.data;

    // Strict ID validation per topic
    if (msg.id !== topicDef.expectedId) {
      this.ignoredCount++;
      this.log('warn', `ID incorreto em ${topic}: esperado ${topicDef.expectedId}, recebido ${msg.id} (ignorado)`);
      return;
    }

    this.messageCount++;
    const pct = Math.round(Math.max(0, Math.min(100, msg.percentage)));
    const status = getStatusFromPercentage(pct);

    this._trashCans.update((cans) => {
      const updated = cans.map((c) => {
        if (c.id === topicDef.id) {
          return { ...c, percentage: pct, value: msg.value, status, lastUpdate: new Date(), connected: true, everReceived: true };
        }
        return c;
      });
      this.saveToStorage(updated);
      return updated;
    });

    this.log('info', `[${topicDef.groupName}] ${pct}% (${status})`, { value: msg.value });
  }

  // ─── Logging ──────────────────────────────────────────────────────────────────
  private log(level: 'info' | 'warn' | 'error', msg: string, data?: Record<string, unknown>): void {
    const ts = new Date().toISOString().slice(11, 23);
    const prefix = `[SmartBin ${ts}]`;
    if (level === 'error') console.error(prefix, msg, data ?? '');
    else if (level === 'warn') console.warn(prefix, msg, data ?? '');
    else console.log(prefix, msg, data ?? '');
  }

  ngOnDestroy(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.client?.end(true);
  }
}
