import 'chart.js/auto';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { AdminService } from '../../../core/services/admin.service';
import { computeRoleChartData } from '../dashboard/admin-utils';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.css']
})
export class AdminUsers implements OnInit {

  admin: any = {};
  users: any[] = [];
  filteredUsers: any[] = [];
  search = '';
  filterYear = '';
  loading = true;
  error = false;
  activeTab: 'all' | 'students' | 'faculty' | 'pending' = 'all';

  totalUsers = 0;
  totalStudents = 0;
  totalFaculty = 0;
  pendingStudents = 0;

  pieChartType: 'pie' = 'pie';
  pieChartData: any = {
    labels: ['Students', 'Faculty', 'Admins'],
    datasets: [{ data: [0, 0, 0], backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'] }]
  };
  pieChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    const user = localStorage.getItem('user');
    if (user) this.admin = JSON.parse(user);
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (res: any) => {
        this.users = res.users || [];
        this.filteredUsers = this.getTabUsers();
        this.totalUsers = this.users.length;
        this.totalStudents = this.users.filter(u => u.role === 'student').length;
        this.totalFaculty = this.users.filter(u => u.role === 'faculty').length;
        this.pendingStudents = this.users.filter(u => u.role === 'student' && !u.isApproved).length;
        const roleData = computeRoleChartData(this.users);
        this.pieChartData = {
          labels: ['Students', 'Faculty', 'Admins'],
          datasets: [{ data: roleData, backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'] }]
        };
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

  filterUsers() {
    const q = this.search.toLowerCase();
    const base = this.getTabUsers();
    let result = q
      ? base.filter(u =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.role?.toLowerCase().includes(q)
        )
      : base;
    if (this.filterYear) {
      result = result.filter(u => u.role !== 'student' || u.year === this.filterYear);
    }
    this.filteredUsers = result;
    this.cdr.detectChanges();
  }

  setTab(tab: 'all' | 'students' | 'faculty' | 'pending') {
    this.activeTab = tab;
    this.search = '';
    this.filterYear = '';
    this.filteredUsers = this.getTabUsers();
    this.cdr.detectChanges();
  }

  getTabUsers(): any[] {
    switch (this.activeTab) {
      case 'students': return this.users.filter(u => u.role === 'student' && u.isApproved !== false);
      case 'faculty':  return this.users.filter(u => u.role === 'faculty');
      case 'pending':  return this.users.filter(u => u.role === 'student' && u.isApproved === false);
      default:         return this.users;
    }
  }

  deleteUser(id: string) {
    if (!confirm('Delete this user?')) return;
    this.adminService.rejectUser(id).subscribe({
      next: () => { this.loadUsers(); },
      error: () => { alert('Failed to delete user.'); }
    });
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'faculty') return 'badge-purple';
    if (role === 'admin')   return 'badge-indigo';
    return 'badge-blue';
  }

  isActive(path: string): boolean { return this.router.url === path; }
  goTo(path: string) { this.router.navigate([path]); }
  logout() { localStorage.clear(); this.router.navigate(['/login']); }
}
