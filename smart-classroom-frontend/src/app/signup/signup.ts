import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.html'
})
export class Signup {

  name = '';
  email = '';
  password = '';
  role = 'student';
  error = '';

  constructor(private http: HttpClient, private router: Router) {}

signup() {
  this.http.post<any>('http://localhost:5000/api/auth/signup', {
    name: this.name,
    email: this.email,
    password: this.password,
    role: this.role
  }).subscribe({
    next: () => {
      alert('Signup successful ✅');
      this.router.navigate(['/login']);
    },
    error: (err) => {
      this.error = err.error?.message || 'Signup failed';
    }
  });
}
}
