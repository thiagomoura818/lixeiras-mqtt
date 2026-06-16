import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'smartbin_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.resolveInitial());

  constructor() {
    // Keep DOM in sync whenever signal changes
    effect(() => this.applyToDom(this.theme()));

    // Listen for OS-level preference changes (only if user hasn't saved a preference)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        this.theme.set(e.matches ? 'dark' : 'light');
      }
    });
  }

  toggle(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    this.theme.set(next);
  }

  private resolveInitial(): Theme {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyToDom(theme: Theme): void {
    // Brief class enables CSS transitions on all elements
    document.body.classList.add('theme-transitioning');
    document.documentElement.setAttribute('data-theme', theme);
    setTimeout(() => document.body.classList.remove('theme-transitioning'), 400);
  }
}
