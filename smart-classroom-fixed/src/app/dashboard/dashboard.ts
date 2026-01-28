import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LiveClassService } from '../services/live-class.service';   // ✅ ADD

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

  user: {
    name: string;
    email: string;
    role: string;
    course: string;
    profilePic?: string;
  } = {
    name: '',
    email: '',
    role: '',
    course: '',
    profilePic: ''
  };

  loading = true;

  private liveTimer: any;
  private alreadyNotified = false;

  constructor(
    private router: Router,
    private cd: ChangeDetectorRef,
    private live: LiveClassService      // ✅ ADD
  ) {}

  ngOnInit() {

    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      this.router.navigate(['/login']);
      return;
    }

    const parsed = JSON.parse(storedUser);

    this.user.name = parsed.name;
    this.user.email = parsed.email || 'N/A';
    this.user.role = parsed.role;
    this.user.course = parsed.course || 'BCA';
    this.user.profilePic = parsed.profilePic || '';

    this.loading = false;
    this.cd.detectChanges();

    // 🔁 CHECK LIVE CLASS EVERY 5 SECONDS
    this.liveTimer = setInterval(() => {
      this.checkLiveClass();
    }, 5000);
  }

  // ==========================
  // 🔔 LIVE CLASS NOTIFICATION
  // ==========================
  checkLiveClass() {
   this.live.getLiveClass().subscribe((res: any) => {


      if (res && !this.alreadyNotified) {

        this.alreadyNotified = true;

        // 🔊 PLAY SOUND
        const audio = new Audio('assets/notify.mp3');
        audio.play().catch(()=>{});

        // 📢 SHOW POPUP
        alert(
          `📢 A class has been started!\n\n` +
          `Class: ${res.title}\n` +
          `Faculty: ${res.facultyName}\n\n` +
          `Join fast!`
        );
      }

      if (!res) {
        this.alreadyNotified = false;
      }

    });
  }

  // ==========================
  // LOGOUT
  // ==========================
  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // ==========================
  // NAVIGATION
  // ==========================
  goToLectures() {
    this.router.navigate(['/lectures']);
  }

  goToAssignments() {
    this.router.navigate(['/student/assignments']);
  }

  goToAnnouncements() {
    this.router.navigate(['/student/announcements']);
  }

  goToAttendance() {
    this.router.navigate(['/student/attendance']);
  }

  goToLive() {
    this.router.navigate(['/student/live']);
  }

}
