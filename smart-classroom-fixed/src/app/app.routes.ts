import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/guards';

// Pages (public)
import { Home }            from './pages/home/home';
import { Login }           from './pages/login/login';
import { Signup }          from './pages/signup/signup';
import { PendingApproval } from './pages/pending-approval/pending-approval';

// Student
import { Dashboard }            from './features/student/dashboard/dashboard';
import { Lectures }             from './features/student/lectures/lecture';
import { StudentAssignments }   from './features/student/assignments/student-assignments';
import { StudentAnnouncements } from './features/student/announcements/student-announcements';
import { StudentAttendance }    from './features/student/attendance/student-attendance';
import { StudentLive }          from './features/student/live/student-live';

// Faculty
import { Faculty }              from './features/faculty/dashboard/faculty';
import { FacultyAssignments }   from './features/faculty/assignments/faculty-assignments';
import { FacultyLectures }      from './features/faculty/lectures/faculty-lectures';
import { FacultyStudents }      from './features/faculty/students/faculty-students';
import { FacultyAnnouncements } from './features/faculty/announcements/faculty-announcements';
import { FacultyAttendance }    from './features/faculty/attendance/faculty-attendance';
import { FacultyLive }          from './features/faculty/live/faculty-live';

// Admin
import { Admin }                    from './features/admin/dashboard/admin';
import { AdminUsers }               from './features/admin/users/admin-users';
import { AdminStatsComponent }      from './features/admin/stats/admin-stats';
import { AdminApprovalsComponent }  from './features/admin/approvals/admin-approvals';
import { AdminAnnouncementsComponent } from './features/admin/announcements/admin-announcements';
import { AdminAssignmentsComponent }   from './features/admin/assignments/admin-assignments';
import { AdminAttendanceComponent }    from './features/admin/attendance/admin-attendance';

// Chat & DM
import { Chat }                  from './features/chat/lecture-chat/chat';
import { DmContainerComponent }  from './features/chat/dm/dm-container/dm-container.component';
import { DmChatComponent }       from './features/chat/dm/dm-chat/dm-chat.component';

export const routes: Routes = [
  // Public
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'pending-approval', component: PendingApproval },

  // Student
  { path: 'dashboard',             component: Dashboard,            canActivate: [roleGuard(['student'])] },
  { path: 'lectures',              component: Lectures,             canActivate: [roleGuard(['student'])] },
  { path: 'student/assignments',   component: StudentAssignments,   canActivate: [roleGuard(['student'])] },
  { path: 'student/announcements', component: StudentAnnouncements, canActivate: [roleGuard(['student'])] },
  { path: 'student/attendance',    component: StudentAttendance,    canActivate: [roleGuard(['student'])] },
  { path: 'student/live',          component: StudentLive,          canActivate: [roleGuard(['student'])] },

  // Faculty
  { path: 'faculty',                component: Faculty,              canActivate: [roleGuard(['faculty'])] },
  { path: 'faculty/assignments',    component: FacultyAssignments,   canActivate: [roleGuard(['faculty'])] },
  { path: 'faculty/lectures',       component: FacultyLectures,      canActivate: [roleGuard(['faculty'])] },
  { path: 'faculty/students',       component: FacultyStudents,      canActivate: [roleGuard(['faculty'])] },
  { path: 'faculty/announcements',  component: FacultyAnnouncements, canActivate: [roleGuard(['faculty'])] },
  { path: 'faculty/attendance',     component: FacultyAttendance,    canActivate: [roleGuard(['faculty'])] },
  { path: 'faculty/live',           component: FacultyLive,          canActivate: [roleGuard(['faculty'])] },

  // Admin
  { path: 'admin',                component: Admin,                      canActivate: [roleGuard(['admin'])] },
  { path: 'admin/users',          component: AdminUsers,                 canActivate: [roleGuard(['admin'])] },
  { path: 'admin/stats',          component: AdminStatsComponent,        canActivate: [roleGuard(['admin'])] },
  { path: 'admin/approvals',      component: AdminApprovalsComponent,    canActivate: [roleGuard(['admin'])] },
  { path: 'admin/announcements',  component: AdminAnnouncementsComponent, canActivate: [roleGuard(['admin'])] },
  { path: 'admin/assignments',    component: AdminAssignmentsComponent,  canActivate: [roleGuard(['admin'])] },
  { path: 'admin/attendance',     component: AdminAttendanceComponent,   canActivate: [roleGuard(['admin'])] },

  // Chat & DM
  { path: 'chat',        component: Chat,               canActivate: [roleGuard(['student', 'faculty'])] },
  { path: 'dm',          component: DmContainerComponent, canActivate: [roleGuard(['student', 'faculty'])] },
  { path: 'dm/:contactId', component: DmChatComponent,  canActivate: [roleGuard(['student', 'faculty'])] },

  // Meeting Room (lazy loaded)
  {
    path: 'meeting-room/:sessionId',
    loadComponent: () => import('./features/meeting/meeting-room').then(m => m.MeetingRoomComponent),
    canActivate: [roleGuard(['student', 'faculty'])]
  },

  // Fallback
  { path: '**', redirectTo: '' }
];
