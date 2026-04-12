import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacultyListComponent } from '../faculty-list/faculty-list.component';
import { FacultyContactsComponent } from '../faculty-contacts/faculty-contacts.component';

@Component({
  selector: 'app-dm-container',
  standalone: true,
  imports: [CommonModule, FacultyListComponent, FacultyContactsComponent],
  template: `
    <app-faculty-list *ngIf="role === 'student'"></app-faculty-list>
    <app-faculty-contacts *ngIf="role === 'faculty'"></app-faculty-contacts>
  `
})
export class DmContainerComponent implements AfterViewInit {
  role = '';

  constructor(private cdr: ChangeDetectorRef) {
    this.role = JSON.parse(localStorage.getItem('user') || '{}').role || '';
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }
}
