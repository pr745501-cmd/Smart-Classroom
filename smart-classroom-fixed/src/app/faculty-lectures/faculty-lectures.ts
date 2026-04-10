import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-faculty-lectures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faculty-lectures.html',
  styleUrls: ['./faculty-lectures.css']
})
export class FacultyLectures implements OnInit {
  title = '';
  subject = '';
  type = 'PDF';
  fileUrl = '';
  targetYear = '';
  targetSemester: number | null = null;
  filterYear = '';
  filterSemester: number | null = null;
  lectures: any[] = [];
  editingLectureId: string | null = null;
  facultyName = '';
  course = 'BCA';

  get filteredLectures(): any[] {
    return this.lectures.filter(l => {
      if (this.filterYear && l.targetYear !== this.filterYear) return false;
      if (this.filterSemester != null && l.targetSemester !== this.filterSemester) return false;
      return true;
    });
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.facultyName = user.name;
    this.course = user.course || 'BCA';
    this.loadLectures();
  }

  goBack() { this.router.navigate(['/faculty']); }

  loadLectures() {
    this.http.get<any>(`http://localhost:5000/api/lectures/faculty/${this.facultyName}`).subscribe(res => {
      this.lectures = res.lectures || [];
      this.cdr.detectChanges();
    });
  }

  uploadLecture() {
    if (!this.targetYear || !this.targetSemester) { alert('Please select target year and semester'); return; }
    const payload = { title: this.title, subject: this.subject, type: this.type.toLowerCase(), fileUrl: this.fileUrl, faculty: this.facultyName, course: this.course, targetYear: this.targetYear, targetSemester: this.targetSemester };
    this.http.post('http://localhost:5000/api/lectures', payload).subscribe(() => {
      alert('Lecture uploaded');
      this.resetForm();
      this.loadLectures();
    });
  }

  editLecture(l: any) {
    this.editingLectureId = l._id;
    this.title = l.title;
    this.subject = l.subject;
    this.type = l.type.toUpperCase();
    this.fileUrl = l.fileUrl || '';
    this.cdr.detectChanges();
  }

  updateLecture() {
    const payload = { title: this.title, subject: this.subject, type: this.type.toLowerCase(), fileUrl: this.fileUrl };
    this.http.put(`http://localhost:5000/api/lectures/${this.editingLectureId}`, payload).subscribe(() => {
      alert('Lecture updated');
      this.resetForm();
      this.loadLectures();
    });
  }

  deleteLecture(id: string) {
    if (!confirm('Delete this lecture?')) return;
    this.http.delete(`http://localhost:5000/api/lectures/${id}`).subscribe(() => this.loadLectures());
  }

  resetForm() {
    this.title = ''; this.subject = ''; this.type = 'PDF'; this.fileUrl = '';
    this.targetYear = ''; this.targetSemester = null; this.editingLectureId = null;
    this.cdr.detectChanges();
  }
}
