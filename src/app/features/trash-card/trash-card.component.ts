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
import { TrashIndicatorComponent } from '../trash-indicator/trash-indicator.component';

@Component({
  selector: 'app-trash-card',
  standalone: true,
  imports: [CommonModule, TrashIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="card"
      [class]="'card card--' + can().status"
      [attr.aria-label]="can().groupName + ': ' + can().percentage + '% — ' + statusLabel()"
    >
      <!-- Colored accent bar -->
      <div class="card__accent" [style.background]="statusColor()"></div>

      <!-- Header -->
      <header class="card__header">
        <div class="card__name-group">
          <span class="card__icon" aria-hidden="true">🗑️</span>
          <h2 class="card__name">{{ can().groupName }}</h2>
        </div>
        <div class="card__conn" [class.online]="can().connected" [attr.aria-label]="can().connected ? 'Online' : 'Offline'">
          <span class="card__conn-dot" aria-hidden="true"></span>
          <span class="card__conn-text">{{ can().connected ? 'Online' : 'Offline' }}</span>
        </div>
      </header>

      <!-- Trash Level Indicator -->
      <div class="card__bin-wrap">
        <app-trash-indicator [percentage]="can().percentage" class="card__bin" aria-hidden="true"/>
      </div>

      <!-- Percentage -->
      <div class="card__pct-row">
        <span class="card__pct" [style.color]="statusColor()">
          {{ can().percentage }}<small class="card__pct-sym">%</small>
        </span>
      </div>

      <!-- Status badge -->
      <div class="card__badge-row">
        <span class="card__badge" [class]="'card__badge card__badge--' + can().status" role="status">
          <span aria-hidden="true">{{ statusEmoji() }}</span>
          {{ statusLabel() }}
        </span>
      </div>

      <!-- Meta info -->
      <dl class="card__meta">
        <div class="card__meta-item">
          <dt class="card__meta-label">Sensor</dt>
          <dd class="card__meta-val">{{ can().value }} mm</dd>
        </div>
        <div class="card__meta-item">
          <dt class="card__meta-label">Atualizado</dt>
          <dd class="card__meta-val">{{ lastUpdateText() }}</dd>
        </div>
      </dl>

      <!-- Critical glow overlay -->
      @if (can().status === 'critical') {
        <div class="card__crit-glow" aria-hidden="true"></div>
      }
    </article>
  `,
  styles: [`
    .card {
      position: relative;
      background: var(--color-bg-card);
      backdrop-filter: var(--backdrop-blur);
      -webkit-backdrop-filter: var(--backdrop-blur);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 0 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow: hidden;
      box-shadow: var(--card-shadow);
      transition: transform var(--transition-base), box-shadow var(--transition-base),
                  border-color var(--transition-base);
    }

    .card:hover {
      transform: translateY(-5px);
      box-shadow: var(--card-shadow-hover);
      border-color: var(--color-border-hover);
    }

    .card:focus-within {
      outline: 2px solid var(--color-empty-light);
      outline-offset: 2px;
    }

    .card--critical {
      border-color: var(--color-critical-border);
      animation: card-alert 2.4s ease-in-out infinite;
    }

    @keyframes card-alert {
      0%, 100% { box-shadow: var(--card-shadow); }
      50% { box-shadow: var(--card-shadow), 0 0 48px rgba(239,68,68,0.14); }
    }

    /* Accent bar */
    .card__accent {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      transition: background var(--transition-slow);
    }

    /* Header */
    .card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 20px;
    }

    .card__name-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card__icon { font-size: 1.3rem; line-height: 1; }

    .card__name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text-1);
      letter-spacing: -0.01em;
    }

    /* Connection indicator */
    .card__conn {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .card__conn-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--color-text-3);
      transition: background var(--transition-base), box-shadow var(--transition-base);
    }

    .card__conn.online .card__conn-dot {
      background: var(--color-online);
      box-shadow: 0 0 6px var(--color-online);
      animation: pulse-online 2.5s ease-in-out infinite;
    }

    @keyframes pulse-online {
      0%, 100% { box-shadow: 0 0 4px var(--color-online); }
      50% { box-shadow: 0 0 12px var(--color-online); }
    }

    .card__conn-text {
      font-size: 0.68rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--color-text-3);
      transition: color var(--transition-base);
    }

    .card__conn.online .card__conn-text { color: var(--color-online); }

    /* Trash Indicator */
    .card__bin-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 220px;
    }

    .card__bin {
      height: 200px;
      width: 120px;
    }

    /* Percentage */
    .card__pct-row {
      text-align: center;
    }

    .card__pct {
      font-size: 3.8rem;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -0.04em;
      font-variant-numeric: tabular-nums;
      transition: color var(--transition-slow);
    }

    .card__pct-sym {
      font-size: 1.9rem;
      font-weight: 700;
      opacity: 0.65;
    }

    /* Badge */
    .card__badge-row { display: flex; justify-content: center; }

    .card__badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 16px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 600;
      border: 1px solid transparent;
      transition: all var(--transition-base);
    }

    .card__badge--empty  { background: var(--color-empty-bg);   color: var(--color-empty-light);   border-color: var(--color-empty-border); }
    .card__badge--medium { background: var(--color-medium-bg);  color: var(--color-medium-light);  border-color: var(--color-medium-border); }
    .card__badge--warning{ background: var(--color-warning-bg); color: var(--color-warning-light); border-color: var(--color-warning-border); }
    .card__badge--critical{
      background: var(--color-critical-bg);
      color: var(--color-critical-light);
      border-color: var(--color-critical-border);
      animation: badge-pulse 1.6s ease-in-out infinite;
    }

    @keyframes badge-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.2); }
      50% { box-shadow: 0 0 14px 3px rgba(239,68,68,0.2); }
    }

    /* Meta */
    .card__meta {
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 11px 14px;
      background: var(--color-surface);
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }

    .card__meta-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card__meta-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--color-text-3);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .card__meta-val {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-text-2);
      font-variant-numeric: tabular-nums;
    }

    /* Critical glow */
    .card__crit-glow {
      position: absolute;
      inset: 0;
      border-radius: var(--radius-lg);
      pointer-events: none;
      background: radial-gradient(ellipse at center bottom, rgba(239,68,68,0.08) 0%, transparent 65%);
      animation: glow-breathe 2.4s ease-in-out infinite;
    }

    @keyframes glow-breathe {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
  `],
})
export class TrashCardComponent {
  readonly can = input.required<TrashCanState>();

  readonly statusLabel = computed(() => getStatusLabel(this.can().status));
  readonly statusColor = computed(() => getStatusColor(this.can().status));
  readonly statusEmoji = computed(() => getStatusEmoji(this.can().status));

  readonly lastUpdateText = computed(() => {
    const d = this.can().lastUpdate;
    if (!d) return '—';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
}
