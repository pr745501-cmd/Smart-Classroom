import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LiveClassService } from '../services/live-class.service';
import { MeetingRoomComponent } from '../meeting-room/meeting-room';

@Component({
  selector: 'app-faculty-live',
  standalone: true,
  imports: [CommonModule, FormsModule, MeetingRoomComponent],
  templateUrl: './faculty-live.html',
  styleUrls: ['./faculty-live.css']
})
export class FacultyLive {

  title = '';
  loading = false;
  meetingCode = '';
  sessionId = '';
  inMeeting = false;
  errorMsg = '';

  constructor(
    private live: LiveClassService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  goBack(): void {
    this.router.navigate(['/faculty']);
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
