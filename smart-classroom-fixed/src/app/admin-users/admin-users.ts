import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.css']
})
export class AdminUsers implements OnInit {

  users: any[] = [];
  filteredUsers: any[] = [];

  search = '';
  loading = true;

  // =========================
  // 📊 Stats
  // =========================
  totalUsers = 0;
  totalStudents = 0;
  totalFaculty = 0;
  pendingStudents = 0;

  // =========================
  // 📊 Pie Chart
  // =========================
 pieChartType: 'pie' = 'pie';

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Students', 'Faculty'],
    datasets: [
      {
        data: [],
        backgroundColor: ['#3b82f6', '#10b981']
      }
    ]
  };

  // ✅ THIS WAS MISSING (FIX)
  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  /* ========================= */
  loadUsers() {
    this.http.get<any>(
      'http://localhost:5000/api/admin/users',
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    ).subscribe(res => {

      this.users = res.users || [];
      this.filteredUsers = this.users;

      // 🔥 Calculate stats
      this.totalUsers = this.users.length;
      this.totalStudents = this.users.filter(u => u.role === 'student').length;
      this.totalFaculty = this.users.filter(u => u.role === 'faculty').length;
      this.pendingStudents = this.users.filter(
        u => u.role === 'student' && !u.isApproved
      ).length;

      // Update chart data
      this.pieChartData.datasets[0].data = [
        this.totalStudents,
        this.totalFaculty
      ];

      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  /* ========================= */
  filterUsers() {
    this.filteredUsers = this.users.filter(u =>
      u.name.toLowerCase().includes(this.search.toLowerCase()) ||
      u.email.toLowerCase().includes(this.search.toLowerCase()) ||
      u.role.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  /* ========================= */
  deleteUser(id: string) {
    if (!confirm("Delete this user?")) return;

    this.http.delete(
      `http://localhost:5000/api/admin/users/${id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    ).subscribe(() => {
      this.loadUsers();
    });
  }

  /* ========================= */
  getByRole(role: string) {
    return this.filteredUsers.filter(u => u.role === role);
  }

  /* ========================= */
  /* ========================= */
getPendingStudents() {
  return this.filteredUsers.filter(
    u => u.role === 'student' && u.isApproved === false
  );
}
}