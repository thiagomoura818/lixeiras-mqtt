import {
  Component,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStats } from '../../core/models/trash-can.model';

interface StatWidget {
  label: string;
  value: number;
  icon: string;
  colorClass: string;
  description: string;
}

@Component({
  selector: 'app-stats-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="stats-bar" aria-label="Resumo do monitoramento">
      @for (widget of widgets(); track widget.label) {
        <div class="widget" [class]="'widget widget--' + widget.colorClass">
          <div class="widget__icon">{{ widget.icon }}</div>
          <div class="widget__body">
            <div class="widget__value">{{ widget.value }}</div>
            <div class="widget__label">{{ widget.label }}</div>
          </div>
          <div class="widget__bar" [style.width.%]="barWidth(widget.value)"></div>
        </div>
      }
    </section>
  `,
  styles: [`
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      width: 100%;
    }

    @media (max-width: 768px) {
      .stats-bar {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 400px) {
      .stats-bar {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
    }

    .widget {
      position: relative;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 18px 20px 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      overflow: hidden;
      transition: transform 0.25s ease;
    }

    .widget:hover {
      transform: translateY(-2px);
    }

    .widget__icon {
      font-size: 1.8rem;
      flex-shrink: 0;
      line-height: 1;
    }

    .widget__body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      z-index: 1;
    }

    .widget__value {
      font-size: 2rem;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -0.03em;
    }

    .widget__label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.6;
    }

    /* Color variants */
    .widget--blue .widget__value { color: #60a5fa; }
    .widget--blue { border-color: rgba(96,165,250,0.2); }

    .widget--green .widget__value { color: #22c55e; }
    .widget--green { border-color: rgba(34,197,94,0.2); }

    .widget--yellow .widget__value { color: #eab308; }
    .widget--yellow { border-color: rgba(234,179,8,0.2); }

    .widget--red .widget__value { color: #ef4444; }
    .widget--red { border-color: rgba(239,68,68,0.2); }

    /* Decorative bar at bottom */
    .widget__bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      border-radius: 0 2px 0 0;
      transition: width 0.6s ease;
    }

    .widget--blue .widget__bar { background: #60a5fa; }
    .widget--green .widget__bar { background: #22c55e; }
    .widget--yellow .widget__bar { background: #eab308; }
    .widget--red .widget__bar { background: #ef4444; }
  `],
})
export class StatsBarComponent {
  readonly stats = input.required<DashboardStats>();

  readonly widgets = () => {
    const s = this.stats();
    const widgets: StatWidget[] = [
      {
        label: 'Monitoradas',
        value: s.total,
        icon: '🗑️',
        colorClass: 'blue',
        description: 'Total de lixeiras',
      },
      {
        label: 'Normal',
        value: s.empty + s.medium,
        icon: '✅',
        colorClass: 'green',
        description: 'Vazias ou nível médio',
      },
      {
        label: 'Atenção',
        value: s.warning,
        icon: '⚠️',
        colorClass: 'yellow',
        description: 'Quase cheias',
      },
      {
        label: 'Críticas',
        value: s.critical,
        icon: '🚨',
        colorClass: 'red',
        description: 'Precisam ser esvaziadas',
      },
    ];
    return widgets;
  };

  barWidth(value: number): number {
    const total = this.stats().total || 1;
    return Math.round((value / total) * 100);
  }
}
