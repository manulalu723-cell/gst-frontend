import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles: ('Admin' | 'Staff')[] = route.data['roles'] || [];
  const currentUser = authService.currentUser();

  if (!authService.isLoggedIn() || !currentUser) {
    return router.parseUrl('/login');
  }

  if (expectedRoles.length > 0 && !expectedRoles.includes(currentUser.role)) {
    // If user doesn't have the role, redirect to dashboard
    return router.parseUrl('/dashboard');
  }

  return true;
};
