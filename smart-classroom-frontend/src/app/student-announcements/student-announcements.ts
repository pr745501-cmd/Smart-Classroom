import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnnouncementService } from '../services/announcement.service';

@Component({
  selector: 'app-student-announcements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-announcements.html'
})
export class StudentAnnouncements implements OnInit {

  announcements: any[] = [];
  loading = true;

  constructor(
    private announcementService: AnnouncementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.loading = true;

    this.announcementService.getAnnouncements().subscribe({
      next: (res) => {
        this.announcements = res.announcements || [];
        this.loading = false;
        this.cdr.detectChanges(); // 🔥 REQUIRED
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
