import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class Signup {

  name = '';
  email = '';
  password = '';
  role = 'student';
  year = '';
  semester: number | null = null;
  error = '';
  loading = false;
  showPass = false;

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  signup() {
    this.loading = true;
    this.error = '';

    if (this.role === 'student') {
      if (!this.year) { this.error = 'Please select your year'; this.loading = false; return; }
      if (!this.semester) { this.error = 'Please select your semester'; this.loading = false; return; }
    }

    const body: any = {
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role
    };
    if (this.role === 'student') {
      body.year = this.year;
      body.semester = this.semester;
    }

    this.http.post<any>('http://localhost:5000/api/auth/signup', body).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.detectChanges();
        if (this.role === 'student') {
          localStorage.setItem('pendingEmail', this.email);
          localStorage.setItem('pendingName', this.name);
          this.router.navigate(['/pending-approval']);
        } else {
          alert('Signup successful ✅');
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Signup failed';
        this.cdr.detectChanges();
      }
    });
  }
}