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
  chart: Chart | null = null;

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
    d.status.toLowerCase() === 'present' ? 100 : 0
  );

  const absentData = data.map(d =>
    d.status.toLowerCase() === 'absent' ? 100 : 0
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
          data: presentData,
          backgroundColor: '#4CAF50'
        },
        {
          label: 'Absent',
          data: absentData,
          backgroundColor: '#F44336'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: ctx => ctx.raw === 100
              ? ctx.dataset.label
              : ''
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Day of Month'
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

}
