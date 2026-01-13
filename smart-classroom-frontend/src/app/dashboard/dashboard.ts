import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

  user = {
    name: '',
    email: '',
    role: '',
    course: '',
    profilePic: ''
  };

  loading = true;

  constructor(private router: Router) {}

  ngOnInit() {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      this.router.navigate(['/login']);
      return;
    }

    const parsed = JSON.parse(storedUser);

    this.user.name = parsed.name;
    this.user.email = parsed.email || 'N/A';
    this.user.role = parsed.role;
    this.user.course = parsed.course || 'Not Assigned';
    this.user.profilePic = parsed.profilePic || '';

    this.loading = false;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // 👉 LECTURES PAGE NAVIGATION
  goToLectures() {
    this.router.navigate(['/lectures']);
  }
}
