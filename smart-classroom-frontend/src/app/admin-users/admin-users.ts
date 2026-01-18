import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>👥 Users Management</h2>
    <p>Students & Faculty will appear here</p>
  `
})
export class AdminUsers {}
