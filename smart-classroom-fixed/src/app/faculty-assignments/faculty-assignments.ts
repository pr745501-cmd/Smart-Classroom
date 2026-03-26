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

  title = '';
  description = '';
  dueDate = '';
  fileUrl = '';

  assignments: any[] = [];
  searchText = '';
  editingAssignmentId: string | null = null;
  facultyName = '';
  course = 'BCA';

  constructor(
    private assignmentService: AssignmentService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      this.facultyName = parsed.name;
      this.course = parsed.course || 'BCA';
    }
  }

  ngOnInit(): void {
    this.loadAssignments();
  }

  get filteredAssignments(): any[] {
    const q = this.searchText.toLowerCase();
    return this.assignments.filter(a => a.title?.toLowerCase().includes(q));
  }

  goBack(): void { this.router.navigate(['/faculty']); }

  loadAssignments() {
    this.assignmentService.getFacultyAssignments(this.facultyName).subscribe({
      next: res => {
        this.assignments = res.assignments || [];
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges()
    });
  }

  addAssignment() {
    if (!this.title || !this.dueDate) { alert('Title and Due Date are required'); return; }
    const data = { title: this.title, description: this.description, dueDate: this.dueDate, fileUrl: this.fileUrl, faculty: this.facultyName, course: this.course };
    this.assignmentService.createAssignment(data).subscribe(() => {
      this.resetForm();
      this.loadAssignments();
    });
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
    const data = { title: this.title, description: this.description, dueDate: this.dueDate, fileUrl: this.fileUrl };
    this.assignmentService.updateAssignment(this.editingAssignmentId!, data).subscribe(() => {
      this.resetForm();
      this.loadAssignments();
    });
  }

  deleteAssignment(id: string) {
    if (!confirm('Delete this assignment?')) return;
    this.assignmentService.deleteAssignment(id).subscribe(() => this.loadAssignments());
  }

  resetForm() {
    this.title = ''; this.description = ''; this.dueDate = ''; this.fileUrl = '';
    this.editingAssignmentId = null;
    this.cdr.detectChanges();
  }

  getStatus(dueDate: string): 'overdue' | 'due-soon' | 'active' {
    const diff = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'overdue';
    if (diff <= 3) return 'due-soon';
    return 'active';
  }
}
