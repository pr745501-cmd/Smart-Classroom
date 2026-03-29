import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnnouncementService } from '../services/announcement.service';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-faculty-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faculty-announcements.html',
  styleUrls: ['./faculty-announcements.css']
})
export class FacultyAnnouncements implements OnInit, OnDestroy {

  title = '';
  message = '';
  targetYear = '';
  targetSemester: number | null = null;
  filterYear = '';
  filterSemester: number | null = null;

  announcements: any[] = [];
  editingId: string | null = null;

  facultyName = '';
  course = 'BCA';

  get filteredAnnouncements(): any[] {
    return this.announcements.filter(a => {
      if (this.filterYear && a.targetYear !== this.filterYear) return false;
      if (this.filterSemester != null && a.targetSemester !== this.filterSemester) return false;
      return true;
    });
  }

  constructor(
    private announcementService: AnnouncementService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      this.facultyName = parsed.name;
      this.course = parsed.course || 'BCA';
    }
  }

  ngOnInit() {
    this.loadAnnouncements();
    this.socketService.joinAnnouncements();

    // When another faculty posts — refresh list
    this.socketService.onAnnouncementCreated(() => {
      this.loadAnnouncements();
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

  goBack(): void {
    this.router.navigate(['/faculty']);
  }

  loadAnnouncements() {
    this.announcementService
      .getFacultyAnnouncements(this.facultyName)
      .subscribe(res => {
        this.announcements = res.announcements || [];
        this.cdr.detectChanges();
      });
  }

  addAnnouncement() {
    if (!this.title || !this.message) {
      alert("All fields required");
      return;
    }
    if (!this.targetYear || !this.targetSemester) {
      alert("Please select target year and semester");
      return;
    }
    const data = {
      title: this.title,
      message: this.message,
      faculty: this.facultyName,
      course: this.course,
      targetYear: this.targetYear,
      targetSemester: this.targetSemester
    };
    this.announcementService.createAnnouncement(data)
      .subscribe(() => {
        alert("Announcement Posted");
        this.resetForm();
        this.loadAnnouncements();
        this.cdr.detectChanges();
      });
  }

  editAnnouncement(a: any) {
    this.editingId = a._id;
    this.title = a.title;
    this.message = a.message;
    this.cdr.detectChanges();
  }

  updateAnnouncement() {
    const data = { title: this.title, message: this.message };
    this.announcementService
      .updateAnnouncement(this.editingId!, data)
      .subscribe(() => {
        alert("Updated");
        this.resetForm();
        this.loadAnnouncements();
        this.cdr.detectChanges();
      });
  }

  deleteAnnouncement(id: string) {
    if (!confirm("Delete announcement?")) return;
    this.announcementService
      .deleteAnnouncement(id)
      .subscribe(() => {
        this.loadAnnouncements();
        this.cdr.detectChanges();
      });
  }

  resetForm() {
    this.title = '';
    this.message = '';
    this.targetYear = '';
    this.targetSemester = null;
    this.editingId = null;
    this.cdr.detectChanges();
  }
}
