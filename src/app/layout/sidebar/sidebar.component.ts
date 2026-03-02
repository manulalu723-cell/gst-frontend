import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  navItems = [
    { label: 'Dashboard', icon: 'grid_view', route: '/dashboard' },
    { label: 'Clients', icon: 'groups', route: '/clients' },
    { label: 'Returns', icon: 'assignment_turned_in', route: '/returns' },
    { label: 'Staff', icon: 'badge', route: '/staff' },
    { label: 'Reports', icon: 'analytics', route: '/reports' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ];
}
