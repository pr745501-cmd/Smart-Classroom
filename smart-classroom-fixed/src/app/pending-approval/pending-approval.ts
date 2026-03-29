import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-approval.html',
  styleUrls: ['./pending-approval.css']
})
export class PendingApproval implements OnInit, OnDestroy {

  loading = false;
  approved = false;
  email = '';
  name = '';

  // Auto-check every 30 seconds
  private pollInterval: any;
  nextCheckIn = 30;
  private countdownInterval: any;

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {
    this.email = localStorage.getItem('pendingEmail') || '';
    this.name  = localStorage.getItem('pendingName')  || 'Student';
  }

  ngOnInit() {
    if (!this.email) { this.router.navigate(['/signup']); return; }
    this.startPolling();
    this.startCountdown();
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
    clearInterval(this.countdownInterval);
  }

  private startPolling() {
    this.pollInterval = setInterval(() => this.silentCheck(), 30000);
  }

  private startCountdown() {
    this.nextCheckIn = 30;
    this.countdownInterval = setInterval(() => {
      this.nextCheckIn--;
      if (this.nextCheckIn <= 0) {
        this.nextCheckIn = 30;
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  private silentCheck() {
    this.http.get<any>(`http://localhost:5000/api/auth/check-status/${this.email}`)
      .subscribe({
        next: (res) => {
          if (res.approved) {
            this.approved = true;
            clearInterval(this.pollInterval);
            clearInterval(this.countdownInterval);
            this.cdr.detectChanges();
            setTimeout(() => {
              localStorage.removeItem('pendingEmail');
              localStorage.removeItem('pendingName');
              this.router.navigate(['/login']);
            }, 2500);
          }
        },
        error: () => {}
      });
  }

  checkNow() {
    this.loading = true;
    this.cdr.detectChanges();
    this.http.get<any>(`http://localhost:5000/api/auth/check-status/${this.email}`)
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res.approved) {
            this.approved = true;
            clearInterval(this.pollInterval);
            clearInterval(this.countdownInterval);
            this.cdr.detectChanges();
            setTimeout(() => {
              localStorage.removeItem('pendingEmail');
              localStorage.removeItem('pendingName');
              this.router.navigate(['/login']);
            }, 2500);
          } else {
            this.nextCheckIn = 30;
            this.cdr.detectChanges();
          }
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
