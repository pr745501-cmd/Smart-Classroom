import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LiveClassService } from '../../../core/services/live-class.service';
import { SocketService } from '../../../core/services/socket.service';
import { MeetingRoomComponent } from '../../meeting/meeting-room';

@Component({
  selector: 'app-student-live',
  standalone: true,
  imports: [CommonModule, FormsModule, MeetingRoomComponent],
  templateUrl: './student-live.html',
  styleUrls: ['./student-live.css']
})
export class StudentLive implements OnInit, OnDestroy {
  showBanner = false;
  bannerCode = '';
  bannerTitle = '';
  meetingCodeInput = '';
  inMeeting = false;
  sessionId = '';
  meetingTitle = '';
  errorMsg = '';
  loading = false;

  constructor(
    private live: LiveClassService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.socketService.reconnectWithToken();

    // Check if a meeting is already active when page loads
    this.live.getLiveClass().subscribe({
      next: (res: any) => {
        if (res?.isLive) { this.showBanner = true; this.bannerCode = res.meetingCode; this.bannerTitle = res.title; this.cdr.detectChanges(); }
      },
      error: () => {}
    });

    // Listen for new meeting started
    this.socketService.onMeetingStarted((data: any) => {
      this.showBanner = true; this.bannerCode = data.meetingCode; this.bannerTitle = data.title;
      this.cdr.detectChanges();
    });

    // If meeting ends while student is inside, go back to dashboard
    this.socketService.onMeetingEnded(() => {
      if (this.inMeeting) this.router.navigate(['/dashboard']);
    });
  }

  ngOnDestroy() {
    this.socketService.offEvent('meetingStarted');
    this.socketService.offEvent('meetingEnded');
  }

  goBack()        { this.router.navigate(['/dashboard']); }
  dismissBanner() { this.showBanner = false; }
  useBannerCode() { this.meetingCodeInput = this.bannerCode; this.showBanner = false; }

  joinMeeting() {
    if (!this.meetingCodeInput.trim()) { this.errorMsg = 'Please enter a meeting code.'; return; }
    this.errorMsg = '';
    this.loading = true;

    this.live.joinClass(this.meetingCodeInput.trim()).subscribe({
      next: (res: any) => {
        this.sessionId = res.sessionId;
        this.meetingTitle = res.title || 'Live class';
        this.inMeeting = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        if (err.status === 404)    this.errorMsg = 'Invalid or expired meeting code.';
        else if (err.status === 0) this.errorMsg = 'Service unavailable. Please try again.';
        else                       this.errorMsg = err.error?.message || 'Failed to join meeting. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }
}
