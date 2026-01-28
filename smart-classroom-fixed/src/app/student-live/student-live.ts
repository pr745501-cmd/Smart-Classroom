import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiveClassService } from '../services/live-class.service';

@Component({
  selector: 'app-student-live',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-live.html',
  styleUrls:['./student-live.css']
})
export class StudentLive implements OnInit, OnDestroy {

  liveClass: any = null;
  timer: any;

  private previousHadClass = false;   // ✅ track state
  private audio = new Audio('assets/notify.mp3'); // ✅ sound

  constructor(
    private live: LiveClassService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {

    this.loadLiveClass();

    // check every 3 seconds
    this.timer = setInterval(() => {
      this.loadLiveClass();
    }, 3000);

  }

  loadLiveClass() {
    this.live.getLiveClass().subscribe(res => {

      const hasClassNow = !!res;

      // 🔔 Play sound ONLY when class just started
      if (!this.previousHadClass && hasClassNow) {
        this.audio.play().catch(()=>{});
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
