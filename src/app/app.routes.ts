import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./core/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'clients',
                loadComponent: () => import('./features/clients/clients.component').then(m => m.ClientsComponent)
            },
            {
                path: 'clients/add',
                loadComponent: () => import('./features/clients/client-form/client-form.component').then(m => m.ClientFormComponent)
            },
            {
                path: 'clients/edit/:id',
                loadComponent: () => import('./features/clients/client-form/client-form.component').then(m => m.ClientFormComponent)
            },
            {
                path: 'returns',
                loadComponent: () => import('./features/returns/returns.component').then(m => m.ReturnsComponent)
            },
            {
                path: 'staff',
                loadComponent: () => import('./features/staff/staff.component').then(m => m.StaffComponent),
                canActivate: [roleGuard],
                data: { roles: ['Admin'] }
            },
            {
                path: 'reports',
                loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
            },
            {
                path: 'settings',
                loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];

