import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(private http: HttpClient, private router: Router) {}

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

        // ✅ If student → go to pending page
        if (this.role === 'student') {
          localStorage.setItem('pendingEmail', this.email);
          this.router.navigate(['/pending-approval']);
        } else {
          // Faculty/Admin → normal login
          alert('Signup successful ✅');
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Signup failed';
      }
    });
  }
}