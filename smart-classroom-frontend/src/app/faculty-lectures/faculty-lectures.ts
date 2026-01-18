import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  lectures: any[] = [];
  loading = false;

  facultyName = '';
  course = 'BCA';

  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const faculty = JSON.parse(localStorage.getItem('user') || '{}');
    this.facultyName = faculty?.name || '';
    this.course = faculty?.course || 'BCA';

    if (!this.facultyName) {
      alert('Faculty not logged in');
      return;
    }

    this.loadLectures();
  }

  /* LOAD FACULTY LECTURES */
  loadLectures() {
    this.loading = true;

    this.http
      .get<any>(`http://localhost:5000/api/lectures/faculty/${this.facultyName}`)
      .subscribe({
        next: (res) => {
          this.lectures = res.lectures;
          this.loading = false;
          this.cd.detectChanges(); // 🔥 DO NOT REMOVE
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  /* UPLOAD LECTURE */
  uploadLecture() {
    if (!this.title || !this.subject) {
      alert('Title & Subject required');
      return;
    }

    const payload = {
      title: this.title.trim(),
      subject: this.subject.trim(),
      type: this.type.toLowerCase(),
      fileUrl: this.fileUrl?.trim() || "",
      faculty: this.facultyName,
      course: this.course
    };

    this.http.post('http://localhost:5000/api/lectures', payload)
      .subscribe({
        next: () => {
          alert('Lecture uploaded successfully ✅');
          this.title = '';
          this.subject = '';
          this.fileUrl = '';
          this.loadLectures();
        },
        error: (err) => {
          alert(err.error?.message || 'Upload failed ❌');
        }
      });
  }
}
