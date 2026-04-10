import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email = '';
  password = '';
  error = '';
  loading = false;
  showPass = false;

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  login() {
    this.error = '';
    this.loading = true;

    const payload = { email: this.email.trim().toLowerCase(), password: this.password };

    this.http.post<any>('http://localhost:5000/api/auth/login', payload).subscribe({
      next: (res) => {
        // Save token and user info to localStorage
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        // Redirect based on role
        if (res.user.role === 'admin')        this.router.navigate(['/admin']);
        else if (res.user.role === 'faculty') this.router.navigate(['/faculty']);
        else                                  this.router.navigate(['/dashboard']);

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        // If student is pending approval, redirect to waiting page
        if (err.status === 403 && err.error?.message?.includes('pending')) {
          localStorage.setItem('pendingEmail', this.email.trim().toLowerCase());
          this.router.navigate(['/pending-approval']);
        } else {
          this.error = err.error?.message || 'Invalid credentials';
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
