import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
    return this.filterYear ? this.students.filter(s => s.year === this.filterYear) : this.students;
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit() {
    this.loadStudents();
    this.loadPendingStudents();
  }

  goBack() { this.router.navigate(['/faculty']); }

  loadStudents() {
    this.http.get<any>(`${environment.apiUrl}/api/students/enrolled`).subscribe({
      next: (res) => { this.students = res.students || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadPendingStudents() {
    this.http.get<any>(`${environment.apiUrl}/api/students/pending`).subscribe({
      next: (res) => { this.pendingStudents = res.students || []; this.cdr.detectChanges(); }
    });
  }

  approveStudent(id: string) {
    this.http.put(`${environment.apiUrl}/api/students/approve/${id}`, {}).subscribe(() => {
      this.loadStudents();
      this.loadPendingStudents();
    });
  }
}
