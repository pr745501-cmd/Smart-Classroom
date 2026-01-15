import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Signup } from './signup/signup';
import { Dashboard } from './dashboard/dashboard';
import { Lectures } from './lecture/lecture';
import { Home } from './pages/home/home';
import { Faculty } from './faculty/faculty';
import { FacultyAssignments } from './faculty-assignments/faculty-assignments';

import { FacultyStudents } from './faculty-students/faculty-students';
import { FacultyLectures } from './faculty-lectures/faculty-lectures';
import { roleGuard } from './guards/guards';

export const routes: Routes = [

  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },

  // 🎓 STUDENT
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [roleGuard(['student'])]
  },
  {
    path: 'lectures',
    component: Lectures,
    canActivate: [roleGuard(['student'])]
  },

  // 👨‍🏫 FACULTY
  {
    path: 'faculty',
    component: Faculty,
    canActivate: [roleGuard(['faculty'])]
  },
  {
    path: 'faculty/assignments',
    component: FacultyAssignments,
    canActivate: [roleGuard(['faculty'])]
  },
 
  {
    path: 'faculty/students',
    component: FacultyStudents,
    canActivate: [roleGuard(['faculty'])]
  },
  {
    path: 'faculty/lectures',
    component: FacultyLectures,
    canActivate: [roleGuard(['faculty'])]
  },

  { path: '**', redirectTo: '' }
];
