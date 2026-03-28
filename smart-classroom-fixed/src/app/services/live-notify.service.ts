import { Injectable } from '@angular/core';
import { LiveClassService } from './live-class.service';

@Injectable({
  providedIn: 'root'
})
export class LiveNotifyService {

  private alreadyNotified = false;

  constructor(private live: LiveClassService) {}

  checkLiveClass() {
    this.live.getLiveClass().subscribe((res: any) => {


      if (res && !this.alreadyNotified) {

        this.alreadyNotified = true;

        // 🔔 Sound
        const audio = new Audio('notify.mp3');
        audio.play().catch(()=>{});

        // 📢 Popup
        alert(`📢 A class has been started!\n\n${res.title}\n\nJoin fast!`);
      }

      if (!res) {
        this.alreadyNotified = false;
      }

    });
  }

}
