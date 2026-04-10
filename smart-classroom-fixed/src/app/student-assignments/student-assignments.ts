import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AssignmentService } from '../services/assignment.service';

@Component({
  selector: 'app-student-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-assignments.html',
  styleUrls: ['./student-assignments.css']
})
export class StudentAssignments implements OnInit {
  assignments: any[] = [];
  searchText = '';
  loading = true;

  // Filter assignments by search text
  get filteredAssignments(): any[] {
    const q = this.searchText.toLowerCase();
    return this.assignments.filter(a => a.title?.toLowerCase().includes(q));
  }

  constructor(private assignmentService: AssignmentService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit() { this.loadAssignments(); }

  goBack() { this.router.navigate(['/dashboard']); }

  loadAssignments() {
    this.assignmentService.getAssignments().subscribe({
      next: (res) => {
        this.assignments = res.assignments || res || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  // Returns 'overdue', 'due-soon', or 'active' based on due date
  getStatus(dueDate: string): 'overdue' | 'due-soon' | 'active' {
    const diffDays = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'due-soon';
    return 'active';
  }
}
