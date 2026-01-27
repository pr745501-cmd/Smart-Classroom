import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnnouncementService } from '../services/announcement.service';

@Component({
  selector: 'app-student-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-announcements.html'
})
export class StudentAnnouncements implements OnInit {

  announcements: any[] = [];
  filteredAnnouncements: any[] = [];

  searchText = '';
  loading = true;

  constructor(
    private announcementService: AnnouncementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.announcementService.getAnnouncements().subscribe({
      next: (res) => {
        this.announcements = res.announcements || res || [];
        this.filteredAnnouncements = this.announcements;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngDoCheck() {
    this.filteredAnnouncements = this.announcements.filter(a =>
      a.title.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

}
