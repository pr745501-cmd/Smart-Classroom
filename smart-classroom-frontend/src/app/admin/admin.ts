import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class Admin implements OnInit {

  admin: any = {};

  constructor(private router: Router) {}

  ngOnInit() {
    const user = localStorage.getItem('user');
    if (user) {
      this.admin = JSON.parse(user);
    }
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  goToUsers() {
    this.router.navigate(['/admin/users']);
  }
  goTo(path: string) {
  this.router.navigate([path]);
}

}
