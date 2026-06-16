import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStats } from '../../core/models/trash-can.model';

interface Widget {
  id: string;
  label: string;
  value: number;
  total: number;
  icon: string;
  mod: string;
}

@Component({
  selector: 'app-stats-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="stats" role="region" aria-label="Resumo do monitoramento">
      @for (w of widgets(); track w.id) {
        <div class="widget widget--{{ w.mod }}" [attr.aria-label]="w.value + ' ' + w.label">
          <div class="widget__icon" aria-hidden="true">{{ w.icon }}</div>
          <div class="widget__body">
            <span class="widget__val">{{ w.value }}</span>
            <span class="widget__label">{{ w.label }}</span>
          </div>
          <div class="widget__progress" aria-hidden="true">
            <div
              class="widget__progress-fill"
              [style.width.%]="pct(w.value, w.total)"
            ></div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    @media (max-width: 860px) { .stats { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 400px) { .stats { grid-template-columns: repeat(2, 1fr); gap: 8px; } }

    .widget {
      position: relative;
      background: var(--color-bg-widget);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 16px 18px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      overflow: hidden;
      box-shadow: var(--card-shadow);
      transition: transform var(--transition-base), box-shadow var(--transition-base);
      cursor: default;
    }

    .widget:hover { transform: translateY(-2px); box-shadow: var(--card-shadow-hover); }

    .widget__icon { font-size: 1.6rem; line-height: 1; flex-shrink: 0; }

    .widget__body {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }

    .widget__val {
      font-size: 2.2rem;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -0.04em;
      font-variant-numeric: tabular-nums;
      transition: color var(--transition-slow);
    }

    .widget__label {
      font-size: 0.68rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-text-3);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Bottom progress bar */
    .widget__progress {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 3px;
      background: var(--color-border);
      border-radius: 0 0 var(--radius-md) var(--radius-md);
    }

    .widget__progress-fill {
      height: 100%;
      border-radius: inherit;
      transition: width 0.7s cubic-bezier(0.4,0,0.2,1);
      min-width: 4px;
    }

    /* Color variants */
    .widget--blue  .widget__val { color: #60a5fa; }
    .widget--blue  .widget__progress-fill { background: #60a5fa; }
    .widget--blue  { border-left: 3px solid rgba(96,165,250,0.3); }

    .widget--green .widget__val { color: var(--color-empty-light); }
    .widget--green .widget__progress-fill { background: var(--color-empty-light); }
    .widget--green { border-left: 3px solid var(--color-empty-border); }

    .widget--yellow .widget__val { color: var(--color-medium-light); }
    .widget--yellow .widget__progress-fill { background: var(--color-medium-light); }
    .widget--yellow { border-left: 3px solid var(--color-medium-border); }

    .widget--red  .widget__val { color: var(--color-critical-light); }
    .widget--red  .widget__progress-fill { background: var(--color-critical-light); }
    .widget--red  { border-left: 3px solid var(--color-critical-border); }
  `],
})
export class StatsBarComponent {
  readonly stats = input.required<DashboardStats>();

  readonly widgets = computed<Widget[]>(() => {
    const s = this.stats();
    return [
      { id: 'total',   label: 'Monitoradas', value: s.total,              total: s.total, icon: '🗑️', mod: 'blue' },
      { id: 'normal',  label: 'Normal',       value: s.empty + s.medium,  total: s.total, icon: '✅', mod: 'green' },
      { id: 'attn',    label: 'Atenção',      value: s.warning,            total: s.total, icon: '⚠️', mod: 'yellow' },
      { id: 'crit',    label: 'Críticas',     value: s.critical,           total: s.total, icon: '🚨', mod: 'red' },
    ];
  });

  pct(value: number, total: number): number {
    return total === 0 ? 0 : Math.round((value / total) * 100);
  }
}
