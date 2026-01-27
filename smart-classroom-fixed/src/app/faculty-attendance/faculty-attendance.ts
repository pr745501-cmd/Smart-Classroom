import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-faculty-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faculty-attendance.html'
})
export class FacultyAttendance implements OnInit {

  students: any[] = [];
  loading = true;          // ✅ ADD THIS (FIX)
  submitting = false;

  date = new Date().toISOString().split('T')[0];
  faculty = '';
  course = 'BCA';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.faculty = user.name || '';

    this.loadStudents();
  }

  loadStudents() {
    this.loading = true;

    this.http.get<any>('http://localhost:5000/api/students/enrolled', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).subscribe({
      next: (res) => {
        this.students = (res.students || []).map((s: any) => ({
          ...s,
          present: true
        }));
        this.loading = false;
        this.cdr.detectChanges(); // 🔥 HARD UI REFRESH
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitAttendance() {
    if (this.students.length === 0) return;

    this.submitting = true;

    const records = this.students.map(s => ({
      studentId: s._id,
      name: s.name,
      status: s.present ? 'present' : 'absent'
    }));

    const payload = {
      date: this.date,
      faculty: this.faculty,
      course: this.course,
      records
    };

    this.http.post('http://localhost:5000/api/attendance', payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).subscribe({
      next: () => {
        alert('Attendance marked successfully');
        this.submitting = false;
        this.cdr.detectChanges();
      },
      error: err => {
        alert(err.error?.message || 'Failed');
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }
}
