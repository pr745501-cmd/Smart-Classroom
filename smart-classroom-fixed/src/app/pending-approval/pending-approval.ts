import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-approval.html'
})
export class PendingApproval {

  loading = false;
  message = '';
  email = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.email = localStorage.getItem('pendingEmail') || '';
  }

  checkStatus() {
    if (!this.email) return;

    this.loading = true;
    this.message = '';

    this.http.get<any>(
      `http://localhost:5000/api/auth/check-status/${this.email}`
    )
    .subscribe({
      next: (res) => {
        this.loading = false;

        if (res.approved) {
          localStorage.removeItem('pendingEmail');
          alert('Your account has been approved 🎉');
          this.router.navigate(['/login']);
        } else {
          this.message = 'Still waiting for faculty approval.';
        }
      },
      error: () => {
        this.loading = false;
        this.message = 'Error checking status.';
      }
    });
  }
}