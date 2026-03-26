import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnnouncementService } from '../services/announcement.service';

@Component({
  selector: 'app-student-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-announcements.html',
  styleUrls: ['./student-announcements.css']
})
export class StudentAnnouncements implements OnInit {

  announcements: any[] = [];
  searchText = '';
  loading = true;

  get filteredAnnouncements(): any[] {
    const q = this.searchText.toLowerCase();
    return this.announcements.filter(a => a.title?.toLowerCase().includes(q));
  }

  constructor(
    private announcementService: AnnouncementService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() { this.loadAnnouncements(); }

  goBack() { this.router.navigate(['/dashboard']); }

  loadAnnouncements() {
    this.announcementService.getAnnouncements().subscribe({
      next: (res) => {
        this.announcements = res.announcements || res || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
