import { inject } from '@angular/core';
import { Router } from '@angular/router';

// Route guard — only allows users with the specified roles to access a route
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
