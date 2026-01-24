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
  loading = true;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents() {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http
      .get<any>('http://localhost:5000/api/students/enrolled', { headers })
      .subscribe({
        next: (res) => {
          console.log('STUDENTS 👉', res);
          this.students = res.students || [];
          this.loading = false;
          this.cdr.detectChanges(); // 🔥 force UI
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }
}
