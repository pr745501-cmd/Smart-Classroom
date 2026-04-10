import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-faculty-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faculty-attendance.html',
  styleUrls: ['./faculty-attendance.css']
})
export class FacultyAttendance implements OnInit {
  students: any[] = [];
  loading = false;
  submitting = false;
  date = new Date().toISOString().split('T')[0];
  faculty = '';
  course = 'BCA';
  selectedYear = '';
  selectedSemester: number | null = null;

  get presentCount(): number { return this.students.filter(s => s.present).length; }
  get absentCount(): number  { return this.students.filter(s => !s.present).length; }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.faculty = user.name || '';
  }

  goBack() { this.router.navigate(['/faculty']); }

  // Mark all students present or absent at once
  selectAll(present: boolean) {
    this.students = this.students.map(s => ({ ...s, present }));
    this.cdr.detectChanges();
  }

  // Load students for the selected year and semester
  loadStudents() {
    if (!this.selectedYear || !this.selectedSemester) return;
    this.loading = true;
    this.http.get<any>(`http://localhost:5000/api/students/enrolled?year=${this.selectedYear}&semester=${this.selectedSemester}`).subscribe({
      next: (res) => {
        this.students = (res.students || []).map((s: any) => ({ ...s, present: true }));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  submitAttendance() {
    if (!this.students.length) return;
    this.submitting = true;
    const records = this.students.map(s => ({ studentId: s._id, name: s.name, status: s.present ? 'present' : 'absent' }));
    const payload = { date: this.date, faculty: this.faculty, course: this.course, targetYear: this.selectedYear, targetSemester: this.selectedSemester, records };
    this.http.post('http://localhost:5000/api/attendance', payload).subscribe({
      next: () => { alert('Attendance marked successfully'); this.submitting = false; this.cdr.detectChanges(); },
      error: err => { alert(err.error?.message || 'Failed'); this.submitting = false; this.cdr.detectChanges(); }
    });
  }
}
