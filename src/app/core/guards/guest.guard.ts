import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const guestGuard = (): Promise<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return new Promise<boolean>((resolve) => {
    if (!authService.isAuthLoading()) {
      if (!authService.currentUser()) {
        resolve(true);
      } else {
        router.navigate(['/']);
        resolve(false);
      }
      return;
    }

    const checkInterval = setInterval(() => {
      if (!authService.isAuthLoading()) {
        clearInterval(checkInterval);
        if (!authService.currentUser()) {
          resolve(true);
        } else {
          router.navigate(['/']);
          resolve(false);
        }
      }
    }, 30);
  });
};
