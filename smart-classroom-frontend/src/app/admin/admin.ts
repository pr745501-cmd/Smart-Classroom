import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Admin Panel</h2>
    <p>Manage users & system</p>
  `
})
export class Admin {}
