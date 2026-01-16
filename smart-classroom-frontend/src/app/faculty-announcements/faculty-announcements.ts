import { Component } from '@angular/core';
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
export class FacultyAnnouncements {

  title = '';
  message = '';

  facultyName = '';

  constructor(private announcementService: AnnouncementService) {
    const user = localStorage.getItem('user');
    if (user) {
      this.facultyName = JSON.parse(user).name; // ✅ LOGGED-IN FACULTY
    }
  }

  addAnnouncement() {
    if (!this.title || !this.message) {
      alert('All fields required');
      return;
    }

    const data = {
      title: this.title,
      message: this.message,
      faculty: this.facultyName   // ✅ DYNAMIC
    };

    this.announcementService.createAnnouncement(data).subscribe(() => {
      alert('Announcement Posted');
      this.title = '';
      this.message = '';
    });
  }
}
