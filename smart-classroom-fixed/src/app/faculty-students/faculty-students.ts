import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-faculty-students',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faculty-students.html'
})
export class FacultyStudents implements OnInit {

  students: any[] = [];
  pendingStudents: any[] = [];
  loading = true;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStudents();
    this.loadPendingStudents();
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  loadStudents() {
    this.http
      .get<any>('http://localhost:5000/api/students/enrolled', {
        headers: this.getHeaders()
      })
      .subscribe({
        next: (res) => {
          this.students = res.students || [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  loadPendingStudents() {
    this.http
      .get<any>('http://localhost:5000/api/students/pending', {
        headers: this.getHeaders()
      })
      .subscribe({
        next: (res) => {
          this.pendingStudents = res.students || [];
          this.cdr.detectChanges();
        }
      });
  }

  approveStudent(id: string) {
    this.http
      .put(`http://localhost:5000/api/students/approve/${id}`, {}, {
        headers: this.getHeaders()
      })
      .subscribe(() => {
        this.loadStudents();
        this.loadPendingStudents();
      });
  }
}