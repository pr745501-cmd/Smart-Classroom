import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssignmentService } from '../services/assignment.service';

@Component({
  selector: 'app-student-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-assignments.html'
})
export class StudentAssignments implements OnInit {

  assignments: any[] = [];
  filteredAssignments: any[] = [];

  searchText = '';
  loading = true;

  constructor(
    private assignmentService: AssignmentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAssignments();
  }

  loadAssignments() {
    this.assignmentService.getAssignments().subscribe({
      next: (res) => {
        this.assignments = res.assignments || res || [];
        this.filteredAssignments = this.assignments;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngDoCheck() {
    this.filteredAssignments = this.assignments.filter(a =>
      a.title.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

}
