import { Component } from '@angular/core';
import { DashboardComponent } from './features/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent],
  template: `<app-dashboard />`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
    }
  `],
})
export class AppComponent {}
