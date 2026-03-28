import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnnouncementService } from '../services/announcement.service';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-student-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-announcements.html',
  styleUrls: ['./student-announcements.css']
})
export class StudentAnnouncements implements OnInit, OnDestroy {

  announcements: any[] = [];
  searchText = '';
  loading = true;

  get filteredAnnouncements(): any[] {
    const q = this.searchText.toLowerCase();
    return this.announcements.filter(a => a.title?.toLowerCase().includes(q));
  }

  constructor(
    private announcementService: AnnouncementService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAnnouncements();
    this.socketService.joinAnnouncements();

    this.socketService.onAnnouncementCreated((a: any) => {
      this.announcements.unshift(a);
      this.cdr.detectChanges();
    });

    this.socketService.onAnnouncementUpdated((a: any) => {
      const idx = this.announcements.findIndex(x => x._id === a._id);
      if (idx !== -1) { this.announcements[idx] = a; this.announcements = [...this.announcements]; }
      this.cdr.detectChanges();
    });

    this.socketService.onAnnouncementDeleted(({ _id }) => {
      this.announcements = this.announcements.filter(x => x._id !== _id);
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.socketService.offEvent('announcementCreated');
    this.socketService.offEvent('announcementUpdated');
    this.socketService.offEvent('announcementDeleted');
  }

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
