import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {

  email: string = '';
  password: string = '';
  error: string = '';
  loading = false;
  showPass = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  login() {
    this.error = '';
    this.loading = true;

    const payload = {
      email: this.email.trim().toLowerCase(), // 🔥 VERY IMPORTANT
      password: this.password
    };

    console.log('LOGIN PAYLOAD 👉', payload);

    this.http.post<any>('http://localhost:5000/api/auth/login', payload)
      .subscribe({
        next: (res) => {
          console.log('LOGIN RESPONSE 👉', res);

          // ✅ SAVE AUTH DATA
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));

          // ✅ ROLE BASED REDIRECT
          if (res.user.role === 'admin') {
            this.router.navigate(['/admin']);
          } 
          else if (res.user.role === 'faculty') {
            this.router.navigate(['/faculty']);
          } 
          else {
            this.router.navigate(['/dashboard']);
          }

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('LOGIN ERROR 👉', err);
          this.error = err.error?.message || 'Invalid credentials';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }
}