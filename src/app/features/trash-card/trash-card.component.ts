import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TrashCanState,
  getStatusLabel,
  getStatusColor,
  getStatusEmoji,
} from '../../core/models/trash-can.model';
import { BatteryComponent } from '../battery/battery.component';

@Component({
  selector: 'app-trash-card',
  standalone: true,
  imports: [CommonModule, BatteryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="card"
      [class]="'card card--' + can().status"
      [attr.aria-label]="'Lixeira ' + can().groupName"
    >
      <!-- Header -->
      <div class="card__header">
        <div class="card__title-group">
          <span class="card__emoji">🗑️</span>
          <h2 class="card__title">{{ can().groupName }}</h2>
        </div>
        <div class="card__connection" [class.connected]="can().connected">
          <span class="card__dot"></span>
          <span class="card__conn-label">{{ can().connected ? 'Online' : 'Offline' }}</span>
        </div>
      </div>

      <!-- Battery -->
      <div class="card__battery-area">
        <app-battery [percentage]="can().percentage" class="card__battery" />
      </div>

      <!-- Stats -->
      <div class="card__stats">
        <div class="card__percentage" [style.color]="statusColor()">
          {{ can().percentage }}<span class="card__pct-symbol">%</span>
        </div>

        <div class="card__status-badge" [class]="'badge badge--' + can().status">
          <span class="badge__emoji">{{ statusEmoji() }}</span>
          <span class="badge__label">{{ statusLabel() }}</span>
        </div>

        <div class="card__meta">
          <div class="card__meta-row">
            <span class="card__meta-label">Sensor</span>
            <span class="card__meta-value">{{ can().value }} mm</span>
          </div>
          <div class="card__meta-row">
            <span class="card__meta-label">Atualizado</span>
            <span class="card__meta-value">{{ formattedTime() }}</span>
          </div>
        </div>
      </div>

      <!-- Critical overlay glow -->
      @if (can().status === 'critical') {
        <div class="card__critical-glow"></div>
      }
    </article>
  `,
  styles: [`
    .card {
      position: relative;
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 24px 20px 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: default;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }

    .card--critical {
      border-color: rgba(239, 68, 68, 0.3);
      animation: card-pulse 2s ease-in-out infinite;
    }

    @keyframes card-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.1); }
      50% { box-shadow: 0 0 40px 8px rgba(239,68,68,0.15); }
    }

    /* Header */
    .card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card__title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .card__emoji {
      font-size: 1.5rem;
    }

    .card__title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .card__connection {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .card__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4b5563;
      transition: background 0.4s;
    }

    .connected .card__dot {
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e;
      animation: blink 2s ease-in-out infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .card__conn-label {
      font-size: 0.7rem;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .connected .card__conn-label {
      color: #22c55e;
    }

    /* Battery area */
    .card__battery-area {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 220px;
      padding: 8px 0;
    }

    .card__battery {
      height: 200px;
      width: 90px;
    }

    /* Stats */
    .card__stats {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .card__percentage {
      font-size: 3.5rem;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -0.03em;
      transition: color 0.5s ease;
    }

    .card__pct-symbol {
      font-size: 1.8rem;
      font-weight: 600;
      opacity: 0.7;
    }

    /* Status badge */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.4s ease;
    }

    .badge--empty {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }
    .badge--medium {
      background: rgba(234, 179, 8, 0.15);
      color: #eab308;
      border: 1px solid rgba(234, 179, 8, 0.3);
    }
    .badge--warning {
      background: rgba(249, 115, 22, 0.15);
      color: #f97316;
      border: 1px solid rgba(249, 115, 22, 0.3);
    }
    .badge--critical {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
      animation: badge-pulse 1.4s ease-in-out infinite;
    }

    @keyframes badge-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
      50% { box-shadow: 0 0 12px 4px rgba(239,68,68,0.2); }
    }

    /* Meta */
    .card__meta {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px 16px;
      background: rgba(255,255,255,0.04);
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.06);
    }

    .card__meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card__meta-label {
      font-size: 0.75rem;
      color: #6b7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .card__meta-value {
      font-size: 0.8rem;
      color: #d1d5db;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    /* Critical glow overlay */
    .card__critical-glow {
      position: absolute;
      inset: 0;
      border-radius: 24px;
      pointer-events: none;
      background: radial-gradient(ellipse at center, rgba(239,68,68,0.06) 0%, transparent 70%);
      animation: glow-pulse 2s ease-in-out infinite;
    }

    @keyframes glow-pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
  `],
})
export class TrashCardComponent {
  readonly can = input.required<TrashCanState>();

  readonly statusLabel = computed(() => getStatusLabel(this.can().status));
  readonly statusColor = computed(() => getStatusColor(this.can().status));
  readonly statusEmoji = computed(() => getStatusEmoji(this.can().status));

  readonly formattedTime = computed(() => {
    const d = this.can().lastUpdate;
    if (!d) return '—';
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  });
}
