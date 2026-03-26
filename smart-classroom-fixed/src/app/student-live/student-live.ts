import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LiveClassService } from '../services/live-class.service';

@Component({
  selector: 'app-student-live',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-live.html',
  styleUrls: ['./student-live.css']
})
export class StudentLive implements OnInit, OnDestroy {

  liveClass: any = null;
  timer: any;

  private previousHadClass = false;
  private audio = new Audio('assets/notify.mp3');

  constructor(
    private live: LiveClassService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadLiveClass();
    this.timer = setInterval(() => {
      this.loadLiveClass();
    }, 3000);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  loadLiveClass() {
    this.live.getLiveClass().subscribe(res => {
      const hasClassNow = !!res;
      if (!this.previousHadClass && hasClassNow) {
        this.audio.play().catch(() => {});
      }
      this.previousHadClass = hasClassNow;
      this.liveClass = res;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
