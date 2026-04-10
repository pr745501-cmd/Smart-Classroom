import { Injectable } from '@angular/core';
import { LiveClassService } from './live-class.service';

@Injectable({ providedIn: 'root' })
export class LiveNotifyService {
  private alreadyNotified = false;

  constructor(private live: LiveClassService) {}

  // Check if a class is live and notify the user once
  checkLiveClass() {
    this.live.getLiveClass().subscribe((res: any) => {
      if (res && !this.alreadyNotified) {
        this.alreadyNotified = true;
        new Audio('notify.mp3').play().catch(() => {});
        alert(`📢 A class has been started!\n\n${res.title}\n\nJoin fast!`);
      }
      if (!res) this.alreadyNotified = false;
    });
  }
}
