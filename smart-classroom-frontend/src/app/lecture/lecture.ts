import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LectureService } from '../services/lecture.service';

@Component({
  selector: 'app-lectures',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lecture.html',
  styleUrl:'./lecture.css',
})
export class Lectures implements OnInit {

  lectures: any[] = [];
  loading = true;

  constructor(private lectureService: LectureService) {}

  ngOnInit(): void {

    // 🔥 API HIT (IMPORTANT)
    this.lectureService.fetchLectures();

    // 🔥 SUBSCRIBE TO STATE
    this.lectureService.lectures$.subscribe(data => {
      this.lectures = data;
      this.loading = false;
    });
  }
}
