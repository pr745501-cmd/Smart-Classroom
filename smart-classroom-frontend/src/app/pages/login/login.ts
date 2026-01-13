import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html'
})
export class Login {
  email = '';
  password = '';
  error = '';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    this.http.post<any>('http://localhost:5000/api/auth/login', {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        // ROLE BASED REDIRECT
        if (res.user.role === 'student') this.router.navigate(['/dashboard']);
        if (res.user.role === 'faculty') this.router.navigate(['/faculty']);
        if (res.user.role === 'admin') this.router.navigate(['/admin']);
      },
      error: () => this.error = 'Invalid credentials'
    });
  }
}
