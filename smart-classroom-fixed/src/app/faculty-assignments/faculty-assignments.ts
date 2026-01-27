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

    this.assignmentService.createAssignment(data).subscribe(() => {
      alert('Assignment Added Successfully ✅');

      this.title = '';
      this.description = '';
      this.dueDate = '';
      this.fileUrl = '';

      this.loadAssignments();
    });
  }

  loadAssignments() {
    this.assignmentService
      .getFacultyAssignments(this.facultyName)
      .subscribe(res => {
        this.assignments = res.assignments || [];
        this.cdr.detectChanges(); // 🔥 DO NOT REMOVE
      });
  }
}
