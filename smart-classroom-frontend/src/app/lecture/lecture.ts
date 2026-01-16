import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LectureService } from '../services/lecture.service';

@Component({
  selector: 'app-lectures',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lecture.html',
  styleUrls: ['./lecture.css']
})
export class Lectures implements OnInit {
  lectures: any[] = [];
  error = '';
constructor(
  private lectureService: LectureService,
  private cd: ChangeDetectorRef   // 🔥
) {}

ngOnInit() {
  this.lectureService.getLectures().subscribe({
    next: (data) => {
      console.log("LECTURES:", data);
      this.lectures = data;
      this.cd.detectChanges();   // 🔥 force UI update
    },
    error: (err) => {
      console.error(err);
      this.error = "Failed to load lectures";
    }
  });
}

}
