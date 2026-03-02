import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'ca_dashboard_theme';
  isDarkMode = signal<boolean>(localStorage.getItem(this.THEME_KEY) === 'dark');

  constructor() {
    effect(() => {
      const mode = this.isDarkMode() ? 'dark' : 'light';
      localStorage.setItem(this.THEME_KEY, mode);
      
      if (this.isDarkMode()) {
        document.documentElement.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
      }
    });
  }

  toggleTheme(): void {
    this.isDarkMode.update(dark => !dark);
  }
}
