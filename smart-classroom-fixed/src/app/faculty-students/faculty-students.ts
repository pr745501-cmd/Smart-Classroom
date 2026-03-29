import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-faculty-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faculty-students.html',
  styleUrls: ['./faculty-students.css']
})
export class FacultyStudents implements OnInit {

  students: any[] = [];
  pendingStudents: any[] = [];
  loading = true;
  filterYear = '';

  get filteredStudents(): any[] {
    if (!this.filterYear) return this.students;
    return this.students.filter(s => s.year === this.filterYear);
  }

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStudents();
    this.loadPendingStudents();
  }

  goBack(): void {
    this.router.navigate(['/faculty']);
  }

  loadStudents() {
    this.http
      .get<any>('http://localhost:5000/api/students/enrolled')
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
      .get<any>('http://localhost:5000/api/students/pending')
      .subscribe({
        next: (res) => {
          this.pendingStudents = res.students || [];
          this.cdr.detectChanges();
        }
      });
  }

  approveStudent(id: string) {
    this.http
      .put(`http://localhost:5000/api/students/approve/${id}`, {})
      .subscribe(() => {
        this.loadStudents();
        this.loadPendingStudents();
        this.cdr.detectChanges();
      });
  }
}
