import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LiveClassService } from '../services/live-class.service';
import { SocketService } from '../services/socket.service';
import { MeetingRoomComponent } from '../meeting-room/meeting-room';

@Component({
  selector: 'app-faculty-live',
  standalone: true,
  imports: [CommonModule, FormsModule, MeetingRoomComponent],
  templateUrl: './faculty-live.html',
  styleUrls: ['./faculty-live.css']
})
export class FacultyLive implements OnInit {

  title = '';
  loading = false;
  meetingCode = '';
  sessionId = '';
  inMeeting = false;
  errorMsg = '';
  hasActiveMeeting = false;

  constructor(
    private live: LiveClassService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.socketService.reconnectWithToken();
  }

  goBack(): void {
    this.router.navigate(['/faculty']);
  }

  forceEnd(): void {
    this.loading = true;
    this.live.forceEndClass().subscribe({
      next: () => {
        this.loading = false;
        this.errorMsg = '';
        this.hasActiveMeeting = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Failed to end previous meeting. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  start(): void {
    if (!this.title.trim()) {
      this.errorMsg = 'Please enter a class title.';
      return;
    }
    this.errorMsg = '';
    this.loading = true;

    this.live.startClass({ title: this.title, facultyName: 'Faculty' }).subscribe({
      next: (res: any) => {
        this.meetingCode = res.meetingCode;
        this.sessionId = res.sessionId;
        this.inMeeting = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        if (err.status === 409) {
          this.errorMsg = 'You already have an active meeting. Please end it first.';
          this.hasActiveMeeting = true;
        } else if (err.status === 0) {
          this.errorMsg = 'Service unavailable. Please try again.';
        } else {
          this.errorMsg = err.error?.message || 'Failed to start meeting. Please try again.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}
