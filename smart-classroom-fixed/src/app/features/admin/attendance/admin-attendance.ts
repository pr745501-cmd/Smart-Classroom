import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { computeAttendanceSummary, computeSessionRow } from '../dashboard/admin-utils';

@Component({
  selector: 'app-admin-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-attendance.html',
  styleUrls: ['./admin-attendance.css']
})
export class AdminAttendanceComponent implements OnInit {
  admin: any = {};
  sessions: any[] = [];
  filtered: any[] = [];
  courseFilter = 'All';
  courses: string[] = [];
  loading = true;
  error = false;
  summary = { totalSessions: 0, overallPresentPct: 0, uniqueStudentCount: 0 };

  // Expose helper to template
  computeSessionRow = computeSessionRow;

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit() {
    this.admin = JSON.parse(localStorage.getItem('user') || '{}');
    this.adminService.getAllAttendance().subscribe({
      next: (res: any) => {
        this.sessions = res.attendance || [];
        this.summary = computeAttendanceSummary(this.sessions);
        this.courses = ['All', ...new Set<string>(this.sessions.map((s: any) => s.course).filter(Boolean))];
        this.filtered = [...this.sessions];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.error = true; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  applyCourseFilter() {
    this.filtered = this.courseFilter === 'All' ? [...this.sessions] : this.sessions.filter(s => s.course === this.courseFilter);
    this.cdr.detectChanges();
  }

  isActive(path: string) { return this.router.url === path; }
  goTo(path: string)     { this.router.navigate([path]); }
  logout()               { localStorage.clear(); this.router.navigate(['/login']); }
}
