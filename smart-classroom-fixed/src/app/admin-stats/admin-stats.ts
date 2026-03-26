import 'chart.js/auto';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin } from 'rxjs';
import { AdminService } from '../services/admin.service';
import { computeRoleChartData, computeBarChartData } from '../admin/admin-utils';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './admin-stats.html',
  styleUrls: ['./admin-stats.css']
})
export class AdminStatsComponent implements OnInit {

  admin: any = {};
  stats: any = null;
  loading = true;
  error = false;

  pieChartType: 'pie' = 'pie';
  barChartType: 'bar' = 'bar';

  pieChartData: any = {
    labels: ['Students', 'Faculty', 'Admins'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6']
    }]
  };

  pieChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };

  barChartData: any = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: '#6366f1'
    }]
  };

  barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

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

    forkJoin({
      stats: this.adminService.getStats(),
      users: this.adminService.getUsers(),
      assignments: this.adminService.getAssignments()
    }).subscribe({
      next: (res: any) => {
        this.stats = res.stats;

        const roleData = computeRoleChartData(res.users.users || []);
        this.pieChartData = {
          labels: ['Students', 'Faculty', 'Admins'],
          datasets: [{
            data: roleData,
            backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6']
          }]
        };

        const bar = computeBarChartData(res.assignments.assignments || []);
        this.barChartData = {
          labels: bar.labels,
          datasets: [{
            data: bar.data,
            backgroundColor: '#6366f1'
          }]
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
