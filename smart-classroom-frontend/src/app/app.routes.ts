import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Signup } from './signup/signup';
import { Dashboard } from './dashboard/dashboard';
import { Lectures } from './lecture/lecture';
import { roleGuard } from './guards/guards';

export const routes: Routes = [

  { path: '', redirectTo: 'signup', pathMatch: 'full' },

  { path: 'signup', component: Signup },
  { path: 'login', component: Login },

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [roleGuard(['student'])]
  },

  // ✅ LECTURES ROUTE
  {
    path: 'lectures',
    component: Lectures,
    canActivate: [roleGuard(['student'])]
  },

  { path: '**', redirectTo: 'signup' }
];
