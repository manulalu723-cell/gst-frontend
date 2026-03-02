import { Component, inject, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSidenavModule, HeaderComponent, SidebarComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent {
  private breakpointObserver = inject(BreakpointObserver);

  isMobile = signal(false);
  isSidenavOpen = signal(true);

  sidenavMode = computed(() => this.isMobile() ? 'over' : 'side');

  constructor() {
    this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map(result => result.matches))
      .subscribe(matches => {
        this.isMobile.set(matches);
        this.isSidenavOpen.set(!matches);
      });
  }

  toggleSidenav() {
    this.isSidenavOpen.update(val => !val);
  }
}
