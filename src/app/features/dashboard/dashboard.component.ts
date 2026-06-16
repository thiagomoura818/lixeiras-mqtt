import {
  Component,
  inject,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrashCanService } from '../../core/services/trash-can.service';
import { ThemeService } from '../../core/services/theme.service';
import { TrashCardComponent } from '../trash-card/trash-card.component';
import { StatsBarComponent } from '../stats-bar/stats-bar.component';
import { SystemHealth } from '../../core/models/trash-can.model';

const HEALTH_CONFIG: Record<SystemHealth, { icon: string; text: string; mod: string }> = {
  normal:    { icon: '✅', text: 'Sistema operando normalmente', mod: 'normal' },
  attention: { icon: '⚠️', text: 'Atenção: lixeiras próximas da capacidade', mod: 'attention' },
  critical:  { icon: '🚨', text: 'Ação imediata necessária: lixeiras cheias', mod: 'critical' },
  offline:   { icon: '📡', text: 'Sem conexão com o broker MQTT', mod: 'offline' },
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TrashCardComponent, StatsBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dash">

      <!-- ═══ HEADER ═══ -->
      <header class="header" role="banner">
        <div class="header__brand">
          <div class="header__logo" aria-hidden="true">♻️</div>
          <div>
            <h1 class="header__title">SmartBin Monitor</h1>
            <p class="header__sub">Monitoramento de Lixeiras Inteligentes</p>
          </div>
        </div>

        <div class="header__controls">
          <!-- Theme toggle -->
          <button
            class="btn-theme"
            (click)="themeService.toggle()"
            [attr.aria-label]="themeService.theme() === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'"
            [attr.title]="themeService.theme() === 'dark' ? 'Tema claro' : 'Tema escuro'"
          >
            @if (themeService.theme() === 'dark') {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            } @else {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>

          <!-- MQTT status pill -->
          <div class="mqtt-pill" [class]="'mqtt-pill mqtt-pill--' + mqttMod()">
            <span class="mqtt-pill__dot" aria-hidden="true"></span>
            <span>{{ mqttLabel() }}</span>
          </div>
        </div>
      </header>

      <!-- ═══ SYSTEM HEALTH BANNER ═══ -->
      <div
        class="health-banner"
        [class]="'health-banner health-banner--' + healthConfig().mod"
        role="status"
        [attr.aria-live]="'polite'"
      >
        <span class="health-banner__icon" aria-hidden="true">{{ healthConfig().icon }}</span>
        <span class="health-banner__text">{{ healthConfig().text }}</span>
        @if (svc.mqttReconnectAttempt() > 0 && !svc.mqttConnected()) {
          <span class="health-banner__attempt">
            Tentativa {{ svc.mqttReconnectAttempt() }}
          </span>
        }
      </div>

      <!-- ═══ STATS ═══ -->
      <app-stats-bar [stats]="svc.stats()" />

      <!-- ═══ DIVIDER ═══ -->
      <div class="divider" role="separator">
        <span class="divider__line"></span>
        <span class="divider__label">Lixeiras em tempo real</span>
        <span class="divider__line"></span>
      </div>

      <!-- ═══ CARDS ═══ -->
      <main class="grid" role="main" aria-label="Grade de lixeiras monitoradas">
        @for (can of svc.trashCans(); track can.id) {
          <app-trash-card [can]="can" />
        }
      </main>

      <!-- ═══ FOOTER ═══ -->
      <footer class="footer" role="contentinfo">
        <p>
          Projeto acadêmico orientado pelo Prof.
          <strong>Elder de Oliveira Rodrigues</strong>
          &nbsp;·&nbsp; SmartBin Monitor v2.0
        </p>
      </footer>
    </div>
  `,
  styles: [`
    .dash {
      max-width: 1240px;
      margin: 0 auto;
      padding: 24px 20px 56px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header__brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header__logo {
      font-size: 2.6rem;
      line-height: 1;
      filter: drop-shadow(0 2px 10px rgba(34,197,94,0.4));
    }

    .header__title {
      font-size: 1.65rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: var(--header-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header__sub {
      font-size: 0.78rem;
      color: var(--color-text-3);
      font-weight: 500;
      margin-top: 1px;
    }

    .header__controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Theme toggle button */
    .btn-theme {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px; height: 40px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-bg-widget);
      color: var(--color-text-2);
      cursor: pointer;
      transition: background var(--transition-base), border-color var(--transition-base),
                  color var(--transition-base), transform var(--transition-fast);
    }

    .btn-theme:hover {
      background: var(--color-bg-card-hover);
      color: var(--color-text-1);
      border-color: var(--color-border-hover);
      transform: rotate(20deg);
    }

    .btn-theme:active { transform: rotate(20deg) scale(0.92); }

    /* MQTT pill */
    .mqtt-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 600;
      border: 1px solid transparent;
      transition: all var(--transition-base);
    }

    .mqtt-pill__dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .mqtt-pill--online {
      background: var(--color-online-bg);
      color: var(--color-online);
      border-color: var(--color-online-border);
    }
    .mqtt-pill--online .mqtt-pill__dot {
      background: var(--color-online);
      animation: pulse-dot 2s infinite;
    }

    .mqtt-pill--offline {
      background: var(--color-critical-bg);
      color: var(--color-critical-light);
      border-color: var(--color-critical-border);
    }
    .mqtt-pill--offline .mqtt-pill__dot { background: var(--color-critical-light); }

    .mqtt-pill--connecting {
      background: var(--color-medium-bg);
      color: var(--color-medium-light);
      border-color: var(--color-medium-border);
    }
    .mqtt-pill--connecting .mqtt-pill__dot {
      background: var(--color-medium-light);
      animation: blink-dot 1s ease-in-out infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { box-shadow: 0 0 4px currentColor; }
      50% { box-shadow: 0 0 12px currentColor; }
    }
    @keyframes blink-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.25; }
    }

    /* ── Health Banner ── */
    .health-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 18px;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      font-size: 0.84rem;
      font-weight: 500;
      transition: all var(--transition-base);
    }

    .health-banner__icon { font-size: 1.1rem; flex-shrink: 0; }
    .health-banner__text { flex: 1; }

    .health-banner__attempt {
      font-size: 0.72rem;
      font-weight: 600;
      opacity: 0.7;
      background: rgba(255,255,255,0.1);
      padding: 2px 8px;
      border-radius: 999px;
    }

    .health-banner--normal    { background: var(--color-online-bg);   color: var(--color-empty-light);   border-color: var(--color-empty-border); }
    .health-banner--attention { background: var(--color-medium-bg);   color: var(--color-medium-light);  border-color: var(--color-medium-border); }
    .health-banner--critical  {
      background: var(--color-critical-bg);
      color: var(--color-critical-light);
      border-color: var(--color-critical-border);
      animation: banner-pulse 2s ease-in-out infinite;
    }
    .health-banner--offline   { background: var(--color-offline-bg);  color: var(--color-offline-text);  border-color: var(--color-offline-border); }

    @keyframes banner-pulse {
      0%, 100% { box-shadow: none; }
      50% { box-shadow: 0 0 24px rgba(239,68,68,0.12); }
    }

    /* ── Divider ── */
    .divider {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .divider__line {
      flex: 1;
      height: 1px;
      background: var(--color-border);
    }

    .divider__label {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-text-3);
      white-space: nowrap;
    }

    /* ── Cards grid ── */
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    @media (max-width: 960px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 580px) {
      .grid { grid-template-columns: 1fr; }
      .dash { padding: 16px 14px 48px; gap: 20px; }
      .header__title { font-size: 1.3rem; }
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid var(--color-border);
    }

    .footer p {
      font-size: 0.75rem;
      color: var(--color-text-3);
    }

    .footer strong { color: var(--color-text-2); }
  `],
})
export class DashboardComponent {
  readonly svc = inject(TrashCanService);
  readonly themeService = inject(ThemeService);

  readonly healthConfig = computed(() => HEALTH_CONFIG[this.svc.systemHealth()]);

  readonly mqttMod = computed(() => {
    if (this.svc.mqttConnected()) return 'online';
    if (this.svc.mqttConnecting()) return 'connecting';
    return 'offline';
  });

  readonly mqttLabel = computed(() => {
    if (this.svc.mqttConnected()) return 'MQTT Online';
    if (this.svc.mqttConnecting()) return 'Conectando...';
    return 'Desconectado';
  });
}
