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
  nextCheckIn = 30;

  private pollInterval: any;
  private countdownInterval: any;

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {
    this.email = localStorage.getItem('pendingEmail') || '';
    this.name  = localStorage.getItem('pendingName')  || 'Student';
  }

  ngOnInit() {
    if (!this.email) { this.router.navigate(['/signup']); return; }
    // Auto-check every 30 seconds
    this.pollInterval = setInterval(() => this.silentCheck(), 30000);
    // Countdown timer for UI
    this.countdownInterval = setInterval(() => {
      this.nextCheckIn = this.nextCheckIn > 1 ? this.nextCheckIn - 1 : 30;
      this.cdr.detectChanges();
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
    clearInterval(this.countdownInterval);
  }

  // Called automatically every 30s — no loading spinner
  private silentCheck() {
    this.http.get<any>(`http://localhost:5000/api/auth/check-status/${this.email}`).subscribe({
      next: (res) => { if (res.approved) this.handleApproved(); },
      error: () => {}
    });
  }

  // Called when user clicks "Check Now" button
  checkNow() {
    this.loading = true;
    this.cdr.detectChanges();
    this.http.get<any>(`http://localhost:5000/api/auth/check-status/${this.email}`).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.approved) this.handleApproved();
        else { this.nextCheckIn = 30; this.cdr.detectChanges(); }
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private handleApproved() {
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

  goToLogin() { this.router.navigate(['/login']); }
}
