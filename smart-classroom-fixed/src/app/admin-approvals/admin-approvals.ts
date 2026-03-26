import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { filterPendingApprovals } from '../admin/admin-utils';

@Component({
  selector: 'app-admin-approvals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-approvals.html',
  styleUrls: ['./admin-approvals.css']
})
export class AdminApprovalsComponent implements OnInit {

  admin: any = {};
  pendingUsers: any[] = [];
  loading = true;
  error = false;
  actionErrors: Record<string, string> = {};

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    const user = localStorage.getItem('user');
    if (user) {
      this.admin = JSON.parse(user);
    }

    this.adminService.getUsers().subscribe({
      next: (res: any) => {
        this.pendingUsers = filterPendingApprovals(res.users || []);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  approve(id: string) {
    this.adminService.approveUser(id).subscribe({
      next: () => {
        this.pendingUsers = this.pendingUsers.filter(u => u._id !== id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.actionErrors[id] = 'Failed to approve';
        this.cdr.detectChanges();
      }
    });
  }

  reject(id: string) {
    this.adminService.rejectUser(id).subscribe({
      next: () => {
        this.pendingUsers = this.pendingUsers.filter(u => u._id !== id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.actionErrors[id] = 'Failed to reject';
        this.cdr.detectChanges();
      }
    });
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
