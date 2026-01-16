import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../services/attendance.service';

@Component({
  selector: 'app-faculty-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faculty-attendance.html'
})
export class FacultyAttendance {

  studentId = '';
  studentName = '';
  subject = '';
  date = '';
  status = 'Present';
  faculty = '';

  constructor(private attendanceService: AttendanceService) {
    const user = JSON.parse(localStorage.getItem('user')!);
    this.faculty = user.name; // logged-in faculty
  }

  saveAttendance() {
    const data = {
      studentId: this.studentId,
      studentName: this.studentName,
      subject: this.subject,
      date: this.date,
      status: this.status,
      faculty: this.faculty
    };

    this.attendanceService.addAttendance(data).subscribe(() => {
      alert('Attendance Saved');
    });
  }
}
