import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-lectures',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lecture.html'
})
export class Lectures implements OnInit {

  lectures: any[] = [];
  loading = true;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef   // 🔥 ADD THIS
  ) {}

  ngOnInit(): void {
    this.loadLectures();
  }

  loadLectures() {
    this.http.get<any>('http://localhost:5000/api/lectures')
      .subscribe({
        next: (res) => {
          console.log('STUDENT LECTURES API 👉', res);

          this.lectures = res.lectures || [];
          this.loading = false;

          // 🔥 FORCE UI UPDATE (PERMANENT FIX)
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }
}
