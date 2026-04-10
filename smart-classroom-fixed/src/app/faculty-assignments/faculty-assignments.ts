import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AssignmentService } from '../services/assignment.service';

@Component({
  selector: 'app-faculty-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faculty-assignments.html',
  styleUrls: ['./faculty-assignments.css']
})
export class FacultyAssignments implements OnInit {
  // Form fields
  title = '';
  description = '';
  dueDate = '';
  fileUrl = '';
  targetYear = '';
  targetSemester: number | null = null;

  // Filter fields
  filterYear = '';
  filterSemester: number | null = null;

  assignments: any[] = [];
  searchText = '';
  editingAssignmentId: string | null = null;
  facultyName = '';
  course = 'BCA';

  get filteredAssignments(): any[] {
    const q = this.searchText.toLowerCase();
    return this.assignments.filter(a => {
      if (q && !a.title?.toLowerCase().includes(q)) return false;
      if (this.filterYear && a.targetYear !== this.filterYear) return false;
      if (this.filterSemester != null && a.targetSemester !== this.filterSemester) return false;
      return true;
    });
  }

  constructor(private assignmentService: AssignmentService, private cdr: ChangeDetectorRef, private router: Router) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.facultyName = user.name;
    this.course = user.course || 'BCA';
  }

  ngOnInit() { this.loadAssignments(); }

  goBack() { this.router.navigate(['/faculty']); }

  loadAssignments() {
    this.assignmentService.getFacultyAssignments(this.facultyName).subscribe({
      next: res => { this.assignments = res.assignments || []; this.cdr.detectChanges(); },
      error: () => this.cdr.detectChanges()
    });
  }

  addAssignment() {
    if (!this.title || !this.dueDate) { alert('Title and Due Date are required'); return; }
    if (!this.targetYear || !this.targetSemester) { alert('Please select target year and semester'); return; }
    const data = { title: this.title, description: this.description, dueDate: this.dueDate, fileUrl: this.fileUrl, faculty: this.facultyName, course: this.course, targetYear: this.targetYear, targetSemester: this.targetSemester };
    this.assignmentService.createAssignment(data).subscribe(() => { this.resetForm(); this.loadAssignments(); });
  }

  editAssignment(a: any) {
    this.editingAssignmentId = a._id;
    this.title = a.title;
    this.description = a.description;
    this.dueDate = a.dueDate.substring(0, 10);
    this.fileUrl = a.fileUrl || '';
    this.cdr.detectChanges();
  }

  updateAssignment() {
    this.assignmentService.updateAssignment(this.editingAssignmentId!, { title: this.title, description: this.description, dueDate: this.dueDate, fileUrl: this.fileUrl })
      .subscribe(() => { this.resetForm(); this.loadAssignments(); });
  }

  deleteAssignment(id: string) {
    if (!confirm('Delete this assignment?')) return;
    this.assignmentService.deleteAssignment(id).subscribe(() => this.loadAssignments());
  }

  resetForm() {
    this.title = ''; this.description = ''; this.dueDate = ''; this.fileUrl = '';
    this.targetYear = ''; this.targetSemester = null; this.editingAssignmentId = null;
    this.cdr.detectChanges();
  }

  getStatus(dueDate: string): 'overdue' | 'due-soon' | 'active' {
    const diff = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'overdue';
    if (diff <= 3) return 'due-soon';
    return 'active';
  }
}
