import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'app-battery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="battery-shell"
      [class.critical]="isCritical()"
      [attr.aria-label]="'Bateria ' + percentage() + ' por cento'"
      role="img"
    >
      <svg
        class="battery-svg"
        viewBox="0 0 80 200"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
      >
        <defs>
          <!-- Fill gradient (left→right for 3D depth) -->
          <linearGradient [id]="ids().grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   [attr.stop-color]="colors().dark"/>
            <stop offset="50%"  [attr.stop-color]="colors().base"/>
            <stop offset="100%" [attr.stop-color]="colors().light"/>
          </linearGradient>

          <!-- Vertical fill gradient (bottom brighter) -->
          <linearGradient [id]="ids().gradV" x1="0" y1="1" x2="0" y2="0"
                          gradientUnits="objectBoundingBox">
            <stop offset="0%"   [attr.stop-color]="colors().light" stop-opacity="1"/>
            <stop offset="100%" [attr.stop-color]="colors().base"  stop-opacity="1"/>
          </linearGradient>

          <!-- Clip: fill rises from bottom -->
          <clipPath [id]="ids().clip">
            <rect x="7" [attr.y]="fillY()" width="66" [attr.height]="fillH()" rx="0"/>
          </clipPath>

          <!-- Glow filter -->
          <filter [id]="ids().glow" x="-30%" y="-10%" width="160%" height="120%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <!-- Critical red drop shadow -->
          <filter [id]="ids().shadow" x="-20%" y="-10%" width="140%" height="120%">
            <feDropShadow dx="0" dy="0" stdDeviation="8"
                          [attr.flood-color]="colors().base" flood-opacity="0.6"/>
          </filter>
        </defs>

        <!-- Terminal cap (top) -->
        <rect x="25" y="0" width="30" height="13" rx="5" class="terminal"/>

        <!-- Outer body frame -->
        <rect x="3" y="11" width="74" height="186" rx="16"
              class="body-outer"
              [attr.stroke]="isCritical() ? colors().base : undefined"/>

        <!-- Inner body background -->
        <rect x="7" y="15" width="66" height="178" rx="12" class="body-bg"/>

        <!-- Fill (clipped to current percentage, from bottom) -->
        <rect x="7" y="15" width="66" height="178" rx="12"
              [attr.fill]="'url(#' + ids().gradV + ')'"
              [attr.clip-path]="'url(#' + ids().clip + ')'"
              [attr.filter]="percentage() > 15 ? 'url(#' + ids().glow + ')' : 'none'"
              class="fill-rect"/>

        <!-- Segment dividers -->
        @for (y of [59, 103, 148]; track y) {
          <line [attr.x1]="7" [attr.y1]="y" [attr.x2]="73" [attr.y2]="y" class="segment"/>
        }

        <!-- Left highlight strip (gloss effect) -->
        <rect x="11" y="19" width="14" height="170" rx="6" class="highlight"/>

        <!-- Right subtle dark edge -->
        <rect x="60" y="19" width="10" height="170" rx="4" class="shadow-edge"/>
      </svg>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .battery-shell {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .battery-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      transition: filter 0.6s ease;
    }

    /* Critical: pulsing red shadow on the whole SVG */
    .battery-shell.critical .battery-svg {
      animation: crit-pulse 1.6s ease-in-out infinite;
    }

    @keyframes crit-pulse {
      0%, 100% { filter: drop-shadow(0 0 6px rgba(239,68,68,0.5)); }
      50%       { filter: drop-shadow(0 0 22px rgba(239,68,68,0.9)); }
    }

    .terminal {
      fill: var(--color-terminal);
    }

    .body-outer {
      fill: none;
      stroke: var(--color-border);
      stroke-width: 2;
    }

    .body-bg {
      fill: var(--color-battery-bg);
    }

    .fill-rect {
      transition: y 0.7s cubic-bezier(0.4,0,0.2,1),
                  height 0.7s cubic-bezier(0.4,0,0.2,1);
    }

    .segment {
      stroke: var(--color-segment);
      stroke-width: 1.5;
      stroke-dasharray: 4 3;
    }

    .highlight {
      fill: var(--color-highlight);
    }

    .shadow-edge {
      fill: rgba(0,0,0,0.08);
    }
  `],
})
export class BatteryComponent {
  readonly percentage = input<number>(0);

  private readonly _uid = Math.random().toString(36).slice(2, 8);

  readonly ids = computed(() => ({
    grad:   `bg-${this._uid}`,
    gradV:  `gv-${this._uid}`,
    clip:   `cl-${this._uid}`,
    glow:   `gw-${this._uid}`,
    shadow: `sh-${this._uid}`,
  }));

  readonly isCritical = computed(() => this.percentage() > 90);

  // Inner body: y=15, height=178, bottom=193
  readonly fillY = computed(() => {
    const pct = Math.max(0, Math.min(100, this.percentage()));
    return 15 + 178 * (1 - pct / 100);
  });

  readonly fillH = computed(() => {
    return 178 * Math.max(0, Math.min(100, this.percentage())) / 100;
  });

  readonly colors = computed(() => {
    const p = this.percentage();
    if (p <= 30) return { dark: '#15803d', base: '#22c55e', light: '#4ade80' };
    if (p <= 70) return { dark: '#a16207', base: '#eab308', light: '#fde047' };
    if (p <= 90) return { dark: '#c2410c', base: '#f97316', light: '#fb923c' };
    return { dark: '#b91c1c', base: '#ef4444', light: '#f87171' };
  });
}
