import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lectures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lecture.html',
  styleUrls: ['./lecture.css']
})
export class Lectures implements OnInit {

  subject: string = '';
  loading = true;

  allLectures: any[] = [];
  lectures: any[] = [];

  ngOnInit() {
    // 🔹 DUMMY DATA (100% WORKING LINKS)
    this.allLectures = [
      {
        title: 'Intro to Web Development',
        subject: 'Web',
        faculty: 'Mr. Sharma',
        type: 'video',
        date: '2026-01-10',
        url: 'https://www.youtube.com/watch?v=HcOc7P5BMi4'
      },
      {
        title: 'HTML Basics PPT',
        subject: 'Web',
        faculty: 'Ms. Verma',
        type: 'ppt',
        date: '2026-01-11',
        url: 'https://www.orimi.com/pdf-test.pdf'
      },
      {
        title: 'CSS Notes PDF',
        subject: 'Web',
        faculty: 'Mr. Khan',
        type: 'pdf',
        date: '2026-01-12',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      }
    ];

    this.lectures = this.allLectures;
    this.loading = false;
  }

  filterBySubject() {
    if (!this.subject.trim()) {
      this.lectures = this.allLectures;
      return;
    }

    this.lectures = this.allLectures.filter(l =>
      l.subject.toLowerCase().includes(this.subject.toLowerCase())
    );
  }

  resetFilter() {
    this.subject = '';
    this.lectures = this.allLectures;
  }
}
