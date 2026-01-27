import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-attendance.html',
  styleUrls: ['./student-attendance.css']

})
export class StudentAttendance implements OnInit {

  attendance: any[] = [];
  loading = true;
  chart: any;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadMyAttendance();

    const now = new Date();
    this.loadMonthlyAttendance(now.getFullYear(), now.getMonth() + 1);
  }

  /* =====================
     LIST VIEW
  ====================== */
  loadMyAttendance() {
    this.http.get<any>('http://localhost:5000/api/attendance/my', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).subscribe({
      next: res => {
        this.attendance = res.attendance || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /* =====================
     MONTHLY CHART
  ====================== */
  loadMonthlyAttendance(year: number, month: number) {
    this.http.get<any>(
      `http://localhost:5000/api/attendance/monthly/${year}/${month}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    ).subscribe({
      next: res => {
        this.renderChart(res.data || []);
        this.cdr.detectChanges();
      }
    });
  }

  renderChart(data: any[]) {

    const labels = data.map(d =>
      new Date(d.date).getDate().toString()
    );

    const presentData = data.map(d =>
      d.status === 'present' ? 1 : 0
    );

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart('attendanceChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Present',
            data: presentData
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              callback: v => v === 1 ? 'Present' : 'Absent'
            }
          }
        }
      }
    });
  }
}
