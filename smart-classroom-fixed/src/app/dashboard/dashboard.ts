import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LiveClassService } from '../services/live-class.service';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit, OnDestroy {

  user: { name: string; email: string; role: string; course: string; profilePic?: string } = {
    name: '', email: '', role: '', course: '', profilePic: ''
  };

  stats = { subjects: 0, pending: 0, attendance: 0 };
  statsLoading = true;
  loading = true;

  private liveTimer: any;
  alreadyNotified = false;

  constructor(
    private router: Router,
    private cd: ChangeDetectorRef,
    private live: LiveClassService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) { this.router.navigate(['/login']); return; }

    const parsed = JSON.parse(storedUser);
    this.user.name     = parsed.name;
    this.user.email    = parsed.email || 'N/A';
    this.user.role     = parsed.role;
    this.user.course   = parsed.course || 'BCA';
    this.user.profilePic = parsed.profilePic || '';

    this.loading = false;
    this.cd.detectChanges();

    // Fetch real stats from backend
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.statsLoading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.statsLoading = false;
        this.cd.detectChanges();
      }
    });

    this.liveTimer = setInterval(() => this.checkLiveClass(), 5000);
  }

  ngOnDestroy() {
    if (this.liveTimer) clearInterval(this.liveTimer);
  }

  checkLiveClass() {
    this.live.getLiveClass().subscribe((res: any) => {
      if (res && !this.alreadyNotified) {
        this.alreadyNotified = true;
        const audio = new Audio('assets/notify.mp3');
        audio.play().catch(() => {});
        alert(`📢 A class has been started!\n\nClass: ${res.title}\nFaculty: ${res.facultyName}\n\nJoin fast!`);
      }
      if (!res) this.alreadyNotified = false;
    });
  }

  logout() { localStorage.clear(); this.router.navigate(['/login']); }

  goToLectures()      { this.router.navigate(['/lectures']); }
  goToAssignments()   { this.router.navigate(['/student/assignments']); }
  goToAnnouncements() { this.router.navigate(['/student/announcements']); }
  goToAttendance()    { this.router.navigate(['/student/attendance']); }
  goToLive()          { this.router.navigate(['/student/live']); }
  goToMessages()      { this.router.navigate(['/dm']); }
}
