import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Signup } from './signup/signup';
import { Home } from './pages/home/home';

import { Dashboard } from './dashboard/dashboard';
import { Lectures } from './lecture/lecture';

import { Faculty } from './faculty/faculty';
import { FacultyAssignments } from './faculty-assignments/faculty-assignments';
import { FacultyStudents } from './faculty-students/faculty-students';
import { FacultyLectures } from './faculty-lectures/faculty-lectures';
import { FacultyAnnouncements } from './faculty-announcements/faculty-announcements';
import { FacultyAttendance } from './faculty-attendance/faculty-attendance';

import { StudentAssignments } from './student-assignments/student-assignments';
import { StudentAnnouncements } from './student-announcements/student-announcements';
//import { StudentAttendance } from './student-attendance/student-attendance';

import { roleGuard } from './guards/guards';

export const routes: Routes = [

  // 🏠 PUBLIC
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },

  // 🎓 STUDENT ROUTES
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
  {
    path: 'student/assignments',
    component: StudentAssignments,
    canActivate: [roleGuard(['student'])]
  },
  {
    path: 'student/announcements',
    component: StudentAnnouncements,
    canActivate: [roleGuard(['student'])]
  },
  /*{
    path: 'student/attendance',
    component: StudentAttendance,
    canActivate: [roleGuard(['student'])]
  },*/

  // 👨‍🏫 FACULTY ROUTES
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
    path: 'faculty/lectures',
    component: FacultyLectures,
    canActivate: [roleGuard(['faculty'])]
  },
  {
    path: 'faculty/students',
    component: FacultyStudents,
    canActivate: [roleGuard(['faculty'])]
  },
  {
    path: 'faculty/announcements',
    component: FacultyAnnouncements,
    canActivate: [roleGuard(['faculty'])]
  },
  {
    path: 'faculty/attendance',
    component: FacultyAttendance,
    canActivate: [roleGuard(['faculty'])]
  },

  // ❌ FALLBACK
  { path: '**', redirectTo: '' }
];
