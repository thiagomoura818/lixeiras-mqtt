import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { getStatusColor } from '../../core/models/trash-can.model';

@Component({
  selector: 'app-battery',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="battery-wrapper" [class.critical]="isCritical()">
      <svg
        class="battery-svg"
        viewBox="0 0 80 160"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Indicador de nível da lixeira"
      >
        <defs>
          <linearGradient [id]="gradId()" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" [attr.stop-color]="color()" stop-opacity="1" />
            <stop offset="100%" [attr.stop-color]="colorLight()" stop-opacity="1" />
          </linearGradient>
          <filter [id]="glowId()" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath [id]="clipId()">
            <rect
              x="6" [attr.y]="clipY()"
              width="68" [attr.height]="clipHeight()"
            />
          </clipPath>
        </defs>

        <!-- Terminal (ponta) no topo -->
        <rect
          x="24" y="0" width="32" height="12"
          rx="4" ry="4"
          class="terminal"
        />

        <!-- Corpo externo da bateria -->
        <rect
          x="2" y="10" width="76" height="146"
          rx="10" ry="10"
          class="body-outer"
        />

        <!-- Fundo interno (vazio) -->
        <rect
          x="6" y="14" width="68" height="138"
          rx="7" ry="7"
          class="body-inner"
        />

        <!-- Preenchimento (nível) -->
        <rect
          x="6" y="14" width="68" height="138"
          rx="7" ry="7"
          [attr.fill]="'url(#' + gradId() + ')'"
          [attr.clip-path]="'url(#' + clipId() + ')'"
          [attr.filter]="isCritical() ? 'url(#' + glowId() + ')' : 'none'"
          class="fill-rect"
        />

        <!-- Divisórias horizontais decorativas -->
        @for (seg of segments; track seg) {
          <line
            [attr.x1]="6" [attr.y1]="seg"
            [attr.x2]="74" [attr.y2]="seg"
            class="segment-line"
          />
        }

        <!-- Brilho interno (highlight) -->
        <rect
          x="10" y="18" width="18" height="120"
          rx="5"
          class="highlight"
        />
      </svg>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .battery-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .battery-wrapper.critical .battery-svg {
      animation: critical-pulse 1.4s ease-in-out infinite;
    }

    .battery-svg {
      width: 100%;
      height: 100%;
      max-width: 120px;
      filter: drop-shadow(0 8px 24px rgba(0,0,0,0.4));
      transition: filter 0.4s ease;
    }

    .terminal {
      fill: #4b5563;
    }

    .body-outer {
      fill: none;
      stroke: #6b7280;
      stroke-width: 2;
    }

    .body-inner {
      fill: #1a1a2e;
    }

    .fill-rect {
      transition: y 0.6s cubic-bezier(0.4,0,0.2,1),
                  height 0.6s cubic-bezier(0.4,0,0.2,1);
    }

    .segment-line {
      stroke: rgba(255,255,255,0.08);
      stroke-width: 1;
    }

    .highlight {
      fill: rgba(255,255,255,0.04);
    }

    @keyframes critical-pulse {
      0%, 100% { filter: drop-shadow(0 0 8px rgba(239,68,68,0.6)); }
      50%       { filter: drop-shadow(0 0 24px rgba(239,68,68,1)); }
    }
  `],
})
export class BatteryComponent {
  readonly percentage = input<number>(0);

  private readonly _uid = Math.random().toString(36).slice(2, 9);
  readonly gradId = computed(() => `grad-${this._uid}`);
  readonly glowId = computed(() => `glow-${this._uid}`);
  readonly clipId = computed(() => `clip-${this._uid}`);

  readonly isCritical = computed(() => this.percentage() > 90);

  // Área interna: y=14, height=138, bottom=152
  // preenchimento sobe de baixo para cima
  readonly clipY = computed(() => {
    const pct = Math.max(0, Math.min(100, this.percentage()));
    const totalHeight = 138;
    const fillHeight = (pct / 100) * totalHeight;
    return 14 + (totalHeight - fillHeight);
  });

  readonly clipHeight = computed(() => {
    const pct = Math.max(0, Math.min(100, this.percentage()));
    return (pct / 100) * 138;
  });

  readonly color = computed(() => {
    const p = this.percentage();
    if (p <= 30) return '#22c55e';
    if (p <= 70) return '#eab308';
    if (p <= 90) return '#f97316';
    return '#ef4444';
  });

  readonly colorLight = computed(() => {
    const p = this.percentage();
    if (p <= 30) return '#4ade80';
    if (p <= 70) return '#fde047';
    if (p <= 90) return '#fb923c';
    return '#f87171';
  });

  // Linhas divisórias decorativas (a cada ~34.5px dentro do corpo)
  readonly segments = [48, 82, 116];
}
