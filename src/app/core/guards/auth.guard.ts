import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const authGuard = (): Promise<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return new Promise<boolean>((resolve) => {
    if (!authService.isAuthLoading()) {
      if (authService.currentUser()) {
        resolve(true);
      } else {
        router.navigate(['/login']);
        resolve(false);
      }
      return;
    }

    const checkInterval = setInterval(() => {
      if (!authService.isAuthLoading()) {
        clearInterval(checkInterval);
        if (authService.currentUser()) {
          resolve(true);
        } else {
          router.navigate(['/login']);
          resolve(false);
        }
      }
    }, 30);
  });
};
