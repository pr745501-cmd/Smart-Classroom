import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faculty',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Faculty Panel</h2>
    <p>Manage classes & students</p>
  `
})
export class Faculty {}
