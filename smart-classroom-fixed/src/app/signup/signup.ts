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
  error = '';
  loading = false;
  showPass = false;

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  signup() {
    this.loading = true;
    this.error = '';

    this.http.post<any>('http://localhost:5000/api/auth/signup', {
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role
    }).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.detectChanges();
        if (this.role === 'student') {
          localStorage.setItem('pendingEmail', this.email);
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