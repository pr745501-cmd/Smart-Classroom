import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnnouncementService } from '../services/announcement.service';

@Component({
  selector: 'app-faculty-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faculty-announcements.html',
  styleUrls: ['./faculty-announcements.css']
})
export class FacultyAnnouncements implements OnInit {

  title = '';
  message = '';

  announcements: any[] = [];
  editingId: string | null = null;

  facultyName = '';
  course = 'BCA';

  constructor(
    private announcementService: AnnouncementService,
    private cdr: ChangeDetectorRef
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
  }

  /* LOAD */
  loadAnnouncements() {
    this.announcementService
      .getFacultyAnnouncements(this.facultyName)
      .subscribe(res => {
        this.announcements = res.announcements || [];
        this.cdr.detectChanges();
      });
  }

  /* CREATE */
  addAnnouncement() {
    if (!this.title || !this.message) {
      alert("All fields required");
      return;
    }

    const data = {
      title: this.title,
      message: this.message,
      faculty: this.facultyName,
      course: this.course
    };

    this.announcementService.createAnnouncement(data)
      .subscribe(() => {
        alert("Announcement Posted");
        this.resetForm();
        this.loadAnnouncements();
      });
  }

  /* EDIT */
  editAnnouncement(a: any) {
    this.editingId = a._id;
    this.title = a.title;
    this.message = a.message;
  }

  /* UPDATE */
  updateAnnouncement() {
    const data = {
      title: this.title,
      message: this.message
    };

    this.announcementService
      .updateAnnouncement(this.editingId!, data)
      .subscribe(() => {
        alert("Updated");
        this.resetForm();
        this.loadAnnouncements();
      });
  }

  /* DELETE */
  deleteAnnouncement(id: string) {
    if (!confirm("Delete announcement?")) return;

    this.announcementService
      .deleteAnnouncement(id)
      .subscribe(() => this.loadAnnouncements());
  }

  resetForm() {
    this.title = '';
    this.message = '';
    this.editingId = null;
  }
}
