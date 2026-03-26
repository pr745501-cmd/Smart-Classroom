import 'chart.js/auto';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin } from 'rxjs';
import { AdminService } from '../services/admin.service';
import { computeRoleChartData, computeAttendanceChartData } from './admin-utils';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, RouterModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class Admin implements OnInit {

  admin: any = {};
  stats: any = null;
  loading = true;
  error = false;

  today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  pieChartType: 'pie' = 'pie';
  doughnutChartType: 'doughnut' = 'doughnut';

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

  doughnutChartData: any = {
    labels: ['Present', 'Absent'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#10b981', '#ef4444']
    }]
  };

  doughnutChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
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
      attendance: this.adminService.getAllAttendance()
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

        const attData = computeAttendanceChartData(res.attendance.attendance || []);
        this.doughnutChartData = {
          labels: ['Present', 'Absent'],
          datasets: [{
            data: attData,
            backgroundColor: ['#10b981', '#ef4444']
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
