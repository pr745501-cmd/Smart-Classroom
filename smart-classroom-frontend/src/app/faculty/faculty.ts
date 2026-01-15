import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-faculty',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faculty.html',
  styleUrls: ['./faculty.css']
})
export class Faculty {

  faculty = {
    name: '',
    email: ''
  };

  constructor(private router: Router) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.faculty.name = user.name || 'Faculty';
    this.faculty.email = user.email || 'N/A';
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
