import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LiveClassService } from '../services/live-class.service';
import { DashboardService } from '../services/dashboard.service';
import { SocketService } from '../services/socket.service';

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

  activeMeeting: any = null;
  showMeetingBanner = false;

  constructor(
    private router: Router,
    private cd: ChangeDetectorRef,
    private live: LiveClassService,
    private dashboardService: DashboardService,
    private socketService: SocketService
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

    // Check for active meeting on load
    this.live.getLiveClass().subscribe({
      next: (res: any) => {
        if (res && res.isLive) {
          this.activeMeeting = res;
          this.showMeetingBanner = true;
          this.cd.detectChanges();
        }
      },
      error: () => {}
    });

    // Real-time meeting notifications via Socket.io
    this.socketService.onMeetingStarted((data: any) => {
      this.activeMeeting = data;
      this.showMeetingBanner = true;
      const audio = new Audio('assets/notify.mp3');
      audio.play().catch(() => {});
      this.cd.detectChanges();
    });

    this.socketService.onMeetingEnded(() => {
      this.activeMeeting = null;
      this.showMeetingBanner = false;
      this.cd.detectChanges();
    });
  }

  ngOnDestroy() {
    this.socketService.offEvent('meetingStarted');
    this.socketService.offEvent('meetingEnded');
  }

  dismissBanner() {
    this.showMeetingBanner = false;
  }

  joinMeeting() {
    this.router.navigate(['/student/live']);
  }

  logout() { localStorage.clear(); this.router.navigate(['/login']); }

  goToLectures()      { this.router.navigate(['/lectures']); }
  goToAssignments()   { this.router.navigate(['/student/assignments']); }
  goToAnnouncements() { this.router.navigate(['/student/announcements']); }
  goToAttendance()    { this.router.navigate(['/student/attendance']); }
  goToLive()          { this.router.navigate(['/student/live']); }
  goToMessages()      { this.router.navigate(['/dm']); }
}
