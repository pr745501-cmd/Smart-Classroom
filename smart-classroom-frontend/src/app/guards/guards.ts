import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const roleGuard = (allowedRoles: string[]) => {
  return () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user || !allowedRoles.includes(user.role)) {
      alert('Access Denied');
      return false;
    }

    return true;
  };
};
