import { Routes } from '@angular/router';

/* PUBLIC */
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Signup } from './signup/signup';

/* STUDENT */
import { Dashboard } from './dashboard/dashboard';
import { Lectures } from './lecture/lecture';
import { StudentAssignments } from './student-assignments/student-assignments';
import { StudentAnnouncements } from './student-announcements/student-announcements';
import { StudentAttendance } from './student-attendance/student-attendance';
import { FacultyLive } from './faculty-live/faculty-live';
import { StudentLive } from './student-live/student-live';

/* FACULTY */
import { Faculty } from './faculty/faculty';
import { FacultyAssignments } from './faculty-assignments/faculty-assignments';
import { FacultyLectures } from './faculty-lectures/faculty-lectures';
import { FacultyStudents } from './faculty-students/faculty-students';
import { FacultyAnnouncements } from './faculty-announcements/faculty-announcements';
import { FacultyAttendance } from './faculty-attendance/faculty-attendance';

/* ADMIN */
import { Admin } from './admin/admin';
import { AdminUsers } from './admin-users/admin-users';

/* GUARD */
import { roleGuard } from './guards/guards';

export const routes: Routes = [

  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },

  /* 🎓 STUDENT */
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
  {
    path: 'student/attendance',
    component: StudentAttendance,
    canActivate: [roleGuard(['student'])]
  },

  /* 👨‍🏫 FACULTY */
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

  /* 👨‍💼 ADMIN */
  {
    path: 'admin',
    component: Admin,
    canActivate: [roleGuard(['admin'])]
  },
  {
    path: 'admin/users',
    component: AdminUsers,
    canActivate: [roleGuard(['admin'])]
  },
  /* 🎓 STUDENT */
{
  path: 'student/live',
  component: StudentLive,
  canActivate: [roleGuard(['student'])]
},

/* 👨‍🏫 FACULTY */
{
  path: 'faculty/live',
  component: FacultyLive,
  canActivate: [roleGuard(['faculty'])]
},


  { path: '**', redirectTo: '' }
];
