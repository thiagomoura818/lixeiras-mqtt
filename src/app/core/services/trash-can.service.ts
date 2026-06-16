import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import mqtt, { MqttClient } from 'mqtt';
import {
  TrashCanState,
  TrashCanMessage,
  DashboardStats,
  getStatusFromPercentage,
} from '../models/trash-can.model';

const TOPICS = [
  { topic: 'projeto/lixeiras/grupo1', groupName: 'Grupo 1', id: 1 },
  { topic: 'projeto/lixeiras/grupo2', groupName: 'Grupo 2', id: 2 },
  { topic: 'projeto/lixeiras/grupo3', groupName: 'Grupo 3', id: 3 },
];

const STORAGE_KEY = 'lixeiras_last_state';

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

  readonly mqttConnected = signal<boolean>(false);
  readonly mqttConnecting = signal<boolean>(false);
  readonly mqttError = signal<string | null>(null);

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

  constructor() {
    this.connect();
  }

  private loadFromStorage(): TrashCanState[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as TrashCanState[];
        return DEFAULT_STATE.map((def) => {
          const found = stored.find((s) => s.id === def.id);
          if (found) {
            return {
              ...found,
              lastUpdate: found.lastUpdate ? new Date(found.lastUpdate) : null,
              connected: false,
            };
          }
          return def;
        });
      }
    } catch {
      // ignore
    }
    return [...DEFAULT_STATE];
  }

  private saveToStorage(cans: TrashCanState[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cans));
    } catch {
      // ignore
    }
  }

  private connect(): void {
    this.mqttConnecting.set(true);
    this.mqttError.set(null);

    try {
      this.client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
        clientId: `lixeiras_monitor_${Math.random().toString(16).slice(2, 10)}`,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 5000,
        keepalive: 60,
      });

      this.client.on('connect', () => {
        this.mqttConnected.set(true);
        this.mqttConnecting.set(false);
        this.mqttError.set(null);

        TOPICS.forEach((t) => {
          this.client?.subscribe(t.topic, (err) => {
            if (err) console.error(`Erro ao assinar ${t.topic}`, err);
          });
        });

        this._trashCans.update((cans) =>
          cans.map((c) => ({ ...c, connected: true }))
        );
      });

      this.client.on('message', (topic: string, payload: Buffer) => {
        this.handleMessage(topic, payload);
      });

      this.client.on('disconnect', () => {
        this.mqttConnected.set(false);
        this._trashCans.update((cans) =>
          cans.map((c) => ({ ...c, connected: false }))
        );
      });

      this.client.on('offline', () => {
        this.mqttConnected.set(false);
        this.mqttConnecting.set(true);
        this._trashCans.update((cans) =>
          cans.map((c) => ({ ...c, connected: false }))
        );
      });

      this.client.on('error', (err: Error) => {
        console.error('MQTT error:', err);
        this.mqttError.set(err.message);
        this.mqttConnected.set(false);
        this.mqttConnecting.set(false);
      });

      this.client.on('reconnect', () => {
        this.mqttConnecting.set(true);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      this.mqttError.set(msg);
      this.mqttConnecting.set(false);
    }
  }

  private handleMessage(topic: string, payload: Buffer): void {
    const topicDef = TOPICS.find((t) => t.topic === topic);
    if (!topicDef) return;

    try {
      const msg = JSON.parse(payload.toString()) as TrashCanMessage;
      const pct = Math.max(0, Math.min(100, msg.percentage));
      const status = getStatusFromPercentage(pct);

      this._trashCans.update((cans) => {
        const updated = cans.map((c) => {
          if (c.id === topicDef.id) {
            return {
              ...c,
              percentage: pct,
              value: msg.value,
              status,
              lastUpdate: new Date(),
              connected: true,
              everReceived: true,
            };
          }
          return c;
        });
        this.saveToStorage(updated);
        return updated;
      });
    } catch (err) {
      console.error('Erro ao parsear mensagem MQTT:', err);
    }
  }

  ngOnDestroy(): void {
    this.client?.end(true);
  }
}
