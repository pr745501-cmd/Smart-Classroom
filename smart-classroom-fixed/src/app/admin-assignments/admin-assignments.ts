import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { filterAssignments, computeAssignmentSummary } from '../admin/admin-utils';

@Component({
  selector: 'app-admin-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-assignments.html',
  styleUrls: ['./admin-assignments.css']
})
export class AdminAssignmentsComponent implements OnInit {
  admin: any = {};
  assignments: any[] = [];
  filtered: any[] = [];
  searchText = '';
  loading = true;
  error = false;
  summary = { total: 0, dueSoonCount: 0, overdueCount: 0 };

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit() {
    this.admin = JSON.parse(localStorage.getItem('user') || '{}');
    this.adminService.getAssignments().subscribe({
      next: (res: any) => {
        this.assignments = res.assignments || [];
        this.summary = computeAssignmentSummary(this.assignments, new Date());
        this.filtered = [...this.assignments];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.error = true; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  applySearch() {
    this.filtered = filterAssignments(this.assignments, this.searchText);
    this.cdr.detectChanges();
  }

  getStatus(dueDate: string): string {
    const days = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (days < 0) return 'overdue';
    if (days <= 7) return 'due-soon';
    return 'active';
  }

  isActive(path: string) { return this.router.url === path; }
  goTo(path: string)     { this.router.navigate([path]); }
  logout()               { localStorage.clear(); this.router.navigate(['/login']); }
}
