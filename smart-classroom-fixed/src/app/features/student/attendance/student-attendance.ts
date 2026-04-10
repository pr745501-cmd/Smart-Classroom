import { Component, OnInit, ChangeDetectorRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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

  presentCount = 0;
  absentCount = 0;
  attendancePct = 0;

  selectedMonth: number;
  selectedYear: number;
  months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private el: ElementRef
  ) {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();
  }

  ngOnInit() {
    this.loadMyAttendance();
  }

  goBack() { this.router.navigate(['/dashboard']); }

  loadMyAttendance() {
    this.http.get<any>('http://localhost:5000/api/attendance/my').subscribe({
      next: res => {
        this.attendance = res.attendance || [];
        this.computeStats();
        this.loading = false;
        this.cdr.detectChanges();
        // Wait for *ngIf="!loading" to render the canvas, then load chart
        setTimeout(() => {
          this.loadMonthlyAttendance(this.selectedYear, this.selectedMonth);
        }, 50);
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  computeStats() {
    const total = this.attendance.length;
    this.presentCount = this.attendance.filter(a => a.status?.toLowerCase() === 'present').length;
    this.absentCount = total - this.presentCount;
    this.attendancePct = total > 0 ? Math.round((this.presentCount / total) * 100) : 0;
  }

  onMonthChange(event: Event) {
    this.selectedMonth = +(event.target as HTMLSelectElement).value;
    this.loadMonthlyAttendance(this.selectedYear, this.selectedMonth);
  }

  loadMonthlyAttendance(year: number, month: number) {
    this.http.get<any>(`http://localhost:5000/api/attendance/monthly/${year}/${month}`).subscribe({
      next: res => {
        const data = res.data || [];
        // Small delay to ensure canvas is rendered before drawing
        setTimeout(() => this.buildChart(data), 0);
      },
      error: () => {
        setTimeout(() => this.buildChart([]), 0);
      }
    });
  }

  buildChart(data: any[]) {
    const canvas = this.el.nativeElement.querySelector('#attendanceChart');
    if (!canvas) {
      // Canvas not ready yet, retry once more
      setTimeout(() => {
        const c = this.el.nativeElement.querySelector('#attendanceChart');
        if (c) this.renderChart(c, data);
      }, 100);
      return;
    }
    this.renderChart(canvas, data);
  }

  renderChart(canvas: HTMLCanvasElement, data: any[]) {
    if (this.chart) { this.chart.destroy(); this.chart = null; }

    // data comes from backend: { day: number, date: string, status: 'present'|'absent'|'none' }
    const labels      = data.map(d => d.day);
    const presentData = data.map(d => d.status === 'present' ? 1 : 0);
    const absentData  = data.map(d => d.status === 'absent'  ? 1 : 0);
    const noneData    = data.map(d => d.status === 'none'    ? 1 : 0);

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Present',
            data: presentData,
            backgroundColor: 'rgba(16,185,129,0.85)',
            borderRadius: 4,
            borderSkipped: false
          },
          {
            label: 'Absent',
            data: absentData,
            backgroundColor: 'rgba(248,113,113,0.85)',
            borderRadius: 4,
            borderSkipped: false
          },
          {
            label: 'No Class',
            data: noneData,
            backgroundColor: 'rgba(226,232,240,0.6)',
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#64748b',
              font: { family: 'Plus Jakarta Sans', weight: 600, size: 12 },
              padding: 20,
              usePointStyle: true,
              pointStyleWidth: 10
            }
          },
          tooltip: {
            callbacks: {
              title: ctx => `Day ${ctx[0].label}`,
              label: ctx => {
                if (ctx.raw === 0) return '';
                if (ctx.dataset.label === 'No Class') return 'No class recorded';
                return ctx.dataset.label ?? '';
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } },
            grid: { display: false },
            border: { display: false },
            title: { display: true, text: 'Day of Month', color: '#94a3b8', font: { size: 11 } }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            max: 1,
            ticks: { display: false },
            grid: { color: 'rgba(0,0,0,0.04)' },
            border: { display: false }
          }
        }
      }
    });
  }
}
