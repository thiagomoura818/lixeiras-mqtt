import {
  Component,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrashCanService } from '../../core/services/trash-can.service';
import { TrashCardComponent } from '../trash-card/trash-card.component';
import { StatsBarComponent } from '../stats-bar/stats-bar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TrashCardComponent, StatsBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <!-- Header -->
      <header class="header">
        <div class="header__brand">
          <div class="header__logo">♻️</div>
          <div class="header__text">
            <h1 class="header__title">SmartBin Monitor</h1>
            <p class="header__subtitle">Monitoramento de Lixeiras Inteligentes</p>
          </div>
        </div>

        <div class="header__status" [class.connected]="service.mqttConnected()">
          @if (service.mqttConnecting() && !service.mqttConnected()) {
            <div class="status-pill status-pill--connecting">
              <span class="status-pill__dot"></span>
              <span>Conectando...</span>
            </div>
          } @else if (service.mqttConnected()) {
            <div class="status-pill status-pill--online">
              <span class="status-pill__dot"></span>
              <span>MQTT Online</span>
            </div>
          } @else {
            <div class="status-pill status-pill--offline">
              <span class="status-pill__dot"></span>
              <span>Sem conexão</span>
            </div>
          }
        </div>
      </header>

      <!-- Offline warning -->
      @if (!service.mqttConnected() && !service.mqttConnecting()) {
        <div class="offline-banner" role="alert">
          <span>📡</span>
          <span>Exibindo último dado recebido — Sem conexão com o broker MQTT</span>
        </div>
      }

      <!-- Stats bar -->
      <app-stats-bar [stats]="service.stats()" class="stats-section" />

      <!-- Divider -->
      <div class="section-label">
        <span class="section-label__line"></span>
        <span class="section-label__text">Lixeiras em tempo real</span>
        <span class="section-label__line"></span>
      </div>

      <!-- Cards grid -->
      <main class="cards-grid" role="main" aria-label="Lixeiras monitoradas">
        @for (can of service.trashCans(); track can.id) {
          <app-trash-card [can]="can" />
        }
      </main>

      <!-- Footer -->
      <footer class="footer">
        <p>
          Projeto acadêmico orientado pelo Prof. <strong>Elder de Oliveira Rodrigues</strong>
          &nbsp;·&nbsp; SmartBin Monitor v1.0
        </p>
      </footer>
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100vh;
      padding: 24px 20px 48px;
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    /* Header */
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
      gap: 16px;
    }

    .header__logo {
      font-size: 2.5rem;
      line-height: 1;
      filter: drop-shadow(0 2px 8px rgba(34,197,94,0.4));
    }

    .header__title {
      font-size: 1.7rem;
      font-weight: 800;
      color: #f1f5f9;
      margin: 0;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header__subtitle {
      font-size: 0.8rem;
      color: #64748b;
      margin: 2px 0 0;
      font-weight: 500;
    }

    /* Status pill */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid transparent;
      transition: all 0.3s ease;
    }

    .status-pill__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-pill--online {
      background: rgba(34, 197, 94, 0.12);
      color: #22c55e;
      border-color: rgba(34, 197, 94, 0.3);
    }
    .status-pill--online .status-pill__dot {
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e;
      animation: pulse-dot 2s infinite;
    }

    .status-pill--offline {
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.3);
    }
    .status-pill--offline .status-pill__dot {
      background: #ef4444;
    }

    .status-pill--connecting {
      background: rgba(234, 179, 8, 0.12);
      color: #eab308;
      border-color: rgba(234, 179, 8, 0.3);
    }
    .status-pill--connecting .status-pill__dot {
      background: #eab308;
      animation: blink-dot 1s ease-in-out infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { box-shadow: 0 0 6px #22c55e; }
      50% { box-shadow: 0 0 14px #22c55e; }
    }
    @keyframes blink-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* Offline banner */
    .offline-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 12px;
      color: #fca5a5;
      font-size: 0.85rem;
      font-weight: 500;
    }

    /* Stats section */
    .stats-section {
      width: 100%;
    }

    /* Section label */
    .section-label {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .section-label__line {
      flex: 1;
      height: 1px;
      background: rgba(255,255,255,0.08);
    }

    .section-label__text {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #4b5563;
      white-space: nowrap;
    }

    /* Cards grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    @media (max-width: 900px) {
      .cards-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 580px) {
      .cards-grid {
        grid-template-columns: 1fr;
      }

      .dashboard {
        gap: 24px;
        padding: 16px 14px 40px;
      }

      .header__title {
        font-size: 1.3rem;
      }
    }

    /* Footer */
    .footer {
      text-align: center;
      padding-top: 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .footer p {
      font-size: 0.75rem;
      color: #374151;
      margin: 0;
    }

    .footer strong {
      color: #4b5563;
    }
  `],
})
export class DashboardComponent {
  readonly service = inject(TrashCanService);
}
