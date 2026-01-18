import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssignmentService } from '../services/assignment.service';

@Component({
  selector: 'app-student-assignments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-assignments.html'
})
export class StudentAssignments implements OnInit {

  assignments: any[] = [];
  loading = true;

  constructor(
    private assignmentService: AssignmentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.assignmentService.getAssignments().subscribe({
      next: (res) => {
        this.assignments = res.assignments || [];
        this.loading = false;
        this.cdr.detectChanges(); // 🔥 REQUIRED
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
