import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'app-trash-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bin-wrap"
      [class]="'bin-wrap bin-wrap--' + statusKey()"
      [attr.aria-label]="'Lixeira ' + percentage() + ' por cento cheia'"
      role="img"
    >
      <svg
        class="bin-svg"
        viewBox="0 0 100 178"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
      >
        <defs>
          <!-- Fill gradient: left→right for 3D depth -->
          <linearGradient [id]="uid('fg')" x1="0" y1="0" x2="1" y2="0"
                          gradientUnits="objectBoundingBox">
            <stop offset="0%"   [attr.stop-color]="color().dark"/>
            <stop offset="45%"  [attr.stop-color]="color().base"/>
            <stop offset="100%" [attr.stop-color]="color().light"/>
          </linearGradient>

          <!-- Lid gradient -->
          <linearGradient [id]="uid('lg')" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#64748b"/>
            <stop offset="100%" stop-color="#334155"/>
          </linearGradient>

          <!-- Body clip (trapezoid body shape) -->
          <clipPath [id]="uid('bc')">
            <path d="M13,26 L87,26 L83,161 Q83,168 76,168 L24,168 Q17,168 17,161 Z"/>
          </clipPath>

          <!-- Glow filter for status -->
          <filter [id]="uid('gf')" x="-25%" y="-10%" width="150%" height="120%">
            <feGaussianBlur stdDeviation="5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- ══ Handle ══ -->
        <rect x="37" y="0" width="26" height="11" rx="5.5"
              [attr.fill]="'url(#' + uid('lg') + ')'"/>
        <!-- Handle shadow line -->
        <rect x="37" y="8" width="26" height="3" rx="0"
              fill="rgba(0,0,0,0.18)"/>

        <!-- ══ Lid ══ -->
        <rect x="5" y="9" width="90" height="17" rx="8"
              [attr.fill]="'url(#' + uid('lg') + ')'"/>
        <!-- Lid decorative divider lines -->
        <line x1="34" y1="11" x2="34" y2="24"
              stroke="rgba(0,0,0,0.15)" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="66" y1="11" x2="66" y2="24"
              stroke="rgba(0,0,0,0.15)" stroke-width="1.5" stroke-linecap="round"/>
        <!-- Lid bottom edge shadow -->
        <rect x="13" y="24" width="74" height="4" rx="0"
              fill="rgba(0,0,0,0.12)"/>

        <!-- ══ Body background ══ -->
        <path
          d="M13,26 L87,26 L83,161 Q83,168 76,168 L24,168 Q17,168 17,161 Z"
          class="body-bg"/>

        <!-- ══ Fill (rises from bottom) ══ -->
        <rect
          x="13" [attr.y]="fillY()" width="74" [attr.height]="fillH()"
          [attr.fill]="'url(#' + uid('fg') + ')'"
          [attr.clip-path]="'url(#' + uid('bc') + ')'"
          [attr.filter]="percentage() > 5 ? 'url(#' + uid('gf') + ')' : 'none'"
          class="fill-rect"
        />

        <!-- ══ Body border ══ -->
        <path
          d="M13,26 L87,26 L83,161 Q83,168 76,168 L24,168 Q17,168 17,161 Z"
          class="body-border"
          [attr.stroke]="percentage() > 5 ? color().base : undefined"
        />

        <!-- ══ Level tick marks (right side, outside body) ══ -->
        @for (tick of ticks; track tick.pct) {
          <g [attr.opacity]="percentage() < tick.pct ? '1' : '0.3'">
            <line
              [attr.x1]="85" [attr.y1]="tick.y"
              [attr.x2]="93" [attr.y2]="tick.y"
              stroke="var(--color-text-3)" stroke-width="1.5"
              stroke-linecap="round"/>
            <text
              [attr.x]="95" [attr.y]="tick.y + 3"
              font-size="6" fill="var(--color-text-3)"
              font-family="Inter, sans-serif">{{ tick.pct }}%</text>
          </g>
        }

        <!-- ══ Gloss highlight (left inner strip) ══ -->
        <rect x="17" y="30" width="12" height="133" rx="5"
              fill="var(--color-highlight)"/>

        <!-- ══ Right inner shadow ══ -->
        <rect x="77" y="30" width="6" height="130" rx="3"
              fill="rgba(0,0,0,0.06)"/>
      </svg>
    </div>
  `,
  styles: [`
    :host { display: flex; align-items: center; justify-content: center; }

    .bin-wrap {
      display: flex; align-items: center; justify-content: center;
      width: 100%; height: 100%;
    }

    .bin-svg {
      width: 100%; height: 100%;
      overflow: visible;
      transition: filter 0.5s ease;
    }

    /* Status glow on the whole SVG */
    .bin-wrap--empty   .bin-svg { filter: drop-shadow(0 8px 20px rgba(0,0,0,0.3)); }
    .bin-wrap--medium  .bin-svg { filter: drop-shadow(0 8px 20px rgba(234,179,8,0.15)); }
    .bin-wrap--warning .bin-svg { filter: drop-shadow(0 8px 20px rgba(249,115,22,0.2)); }
    .bin-wrap--critical .bin-svg { animation: crit-glow 1.6s ease-in-out infinite; }

    @keyframes crit-glow {
      0%, 100% { filter: drop-shadow(0 0 8px rgba(239,68,68,0.5)); }
      50%       { filter: drop-shadow(0 0 28px rgba(239,68,68,0.95)); }
    }

    .body-bg {
      fill: var(--color-battery-bg);
    }

    .body-border {
      fill: none;
      stroke: var(--color-border);
      stroke-width: 1.5;
    }

    .fill-rect {
      transition:
        y 0.75s cubic-bezier(0.4, 0, 0.2, 1),
        height 0.75s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `],
})
export class TrashIndicatorComponent {
  readonly percentage = input<number>(0);

  private _uid(suffix: string) { return `${this._id}-${suffix}`; }
  private readonly _id = `b${Math.random().toString(36).slice(2, 7)}`;
  readonly uid = (s: string) => `${this._id}-${s}`;

  readonly statusKey = computed(() => {
    const p = this.percentage();
    if (p <= 30) return 'empty';
    if (p <= 70) return 'medium';
    if (p <= 90) return 'warning';
    return 'critical';
  });

  // Body inner: y=26 to y=168, height=142
  readonly fillY = computed(() => 168 - 142 * Math.max(0, Math.min(100, this.percentage())) / 100);
  readonly fillH = computed(() => 142 * Math.max(0, Math.min(100, this.percentage())) / 100);

  readonly color = computed(() => {
    const p = this.percentage();
    if (p <= 30) return { dark: '#15803d', base: '#22c55e', light: '#4ade80' };
    if (p <= 70) return { dark: '#a16207', base: '#eab308', light: '#fde047' };
    if (p <= 90) return { dark: '#c2410c', base: '#f97316', light: '#fb923c' };
    return  { dark: '#b91c1c', base: '#ef4444', light: '#f87171' };
  });

  // Tick marks at 25%, 50%, 75% (y = 168 - 142*pct)
  readonly ticks = [
    { pct: 75, y: 168 - 142 * 0.75 },  // y ≈ 61.5
    { pct: 50, y: 168 - 142 * 0.5  },  // y ≈ 97
    { pct: 25, y: 168 - 142 * 0.25 },  // y ≈ 132.5
  ];
}
