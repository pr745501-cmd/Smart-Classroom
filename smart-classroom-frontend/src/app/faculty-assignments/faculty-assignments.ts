import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-faculty-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './faculty-assignments.html',
  styleUrls: ['./faculty-assignments.css']
})
export class FacultyAssignments {

  title = '';
  description = '';
  dueDate = '';
  selectedFile: File | null = null;

  assignments: any[] = [];

  constructor(private http: HttpClient) {
    this.fetchAssignments();
  }

  // ✅ FILE CHANGE HANDLER (IMPORTANT)
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // ✅ ADD ASSIGNMENT
  addAssignment() {
    if (!this.title || !this.description || !this.dueDate) {
      alert('All fields required');
      return;
    }

    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('description', this.description);
    formData.append('dueDate', this.dueDate);

    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.http.post<any>('http://localhost:5000/api/assignment/add', formData)
      .subscribe({
        next: (res) => {
          alert('Assignment added');
          this.fetchAssignments();

          // reset
          this.title = '';
          this.description = '';
          this.dueDate = '';
          this.selectedFile = null;
        },
        error: (err) => {
          console.error(err);
          alert('Error adding assignment');
        }
      });
  }

  // ✅ FETCH ASSIGNMENTS
  fetchAssignments() {
    this.http.get<any>('http://localhost:5000/api/assignment')
      .subscribe(res => {
        this.assignments = res.assignments || [];
      });
  }
}
