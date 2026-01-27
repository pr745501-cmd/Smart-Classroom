import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  editingAssignmentId: string | null = null;

  facultyName = '';
  course = 'BCA';

  constructor(
    private assignmentService: AssignmentService,
    private cdr: ChangeDetectorRef
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

  /* ================= LOAD ================= */

  loadAssignments() {
    this.assignmentService
      .getFacultyAssignments(this.facultyName)
      .subscribe(res => {
        this.assignments = res.assignments || [];
        this.cdr.detectChanges();
      });
  }

  /* ================= ADD ================= */

  addAssignment() {

    if (!this.title || !this.dueDate) {
      alert('Title and Due Date are required');
      return;
    }

    const data = {
      title: this.title,
      description: this.description,
      dueDate: this.dueDate,
      fileUrl: this.fileUrl,
      faculty: this.facultyName,
      course: this.course
    };

    this.assignmentService.createAssignment(data)
      .subscribe(() => {
        alert('Assignment Added ✅');
        this.resetForm();
        this.loadAssignments();
      });
  }

  /* ================= EDIT ================= */

  editAssignment(a: any) {
    this.editingAssignmentId = a._id;
    this.title = a.title;
    this.description = a.description;
    this.dueDate = a.dueDate.substring(0, 10);
    this.fileUrl = a.fileUrl || '';
  }

  /* ================= UPDATE ================= */

  updateAssignment() {

    const data = {
      title: this.title,
      description: this.description,
      dueDate: this.dueDate,
      fileUrl: this.fileUrl
    };

    this.assignmentService
      .updateAssignment(this.editingAssignmentId!, data)
      .subscribe(() => {
        alert("Assignment Updated ✅");
        this.resetForm();
        this.loadAssignments();
      });
  }

  /* ================= DELETE ================= */

  deleteAssignment(id: string) {
    if (!confirm("Delete this assignment?")) return;

    this.assignmentService
      .deleteAssignment(id)
      .subscribe(() => this.loadAssignments());
  }

  /* ================= RESET ================= */

  resetForm() {
    this.title = '';
    this.description = '';
    this.dueDate = '';
    this.fileUrl = '';
    this.editingAssignmentId = null;
  }

}
