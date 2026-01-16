import { Component, OnInit } from '@angular/core';
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

  constructor(private assignmentService: AssignmentService) {
    // ✅ get logged-in faculty name
    const user = localStorage.getItem('user');
    if (user) {
      this.facultyName = JSON.parse(user).name;
    }
  }

  // ✅ REQUIRED because we implemented OnInit
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
      faculty: this.facultyName   // ✅ dynamic faculty
    };

    this.assignmentService.createAssignment(data).subscribe(() => {
      alert('Assignment Added Successfully');

      // reset form
      this.title = '';
      this.description = '';
      this.dueDate = '';
      this.fileUrl = '';

      this.loadAssignments();
    });
  }

  loadAssignments() {
    this.assignmentService.getAssignments().subscribe(data => {
      this.assignments = data;
    });
  }
}
