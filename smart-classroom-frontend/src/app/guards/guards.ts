import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const user = localStorage.getItem('user');

    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    const parsedUser = JSON.parse(user);

    if (!allowedRoles.includes(parsedUser.role)) {
      alert('ACCESS DENIED');
      router.navigate(['/login']);
      return false;
    }

    return true;
  };
};
