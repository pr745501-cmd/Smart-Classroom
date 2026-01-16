import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-student-announcements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-announcements.html',
  styleUrls: ['./student-announcements.css']
})
export class StudentAnnouncements implements OnInit {

  announcements: any[] = [];

  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef   // 🔥 IMPORTANT
  ) {}

  ngOnInit() {
    this.http.get<any>('http://localhost:5000/api/announcement')
      .subscribe({
        next: (res) => {
          console.log('ANNOUNCEMENT API RESPONSE:', res);
          this.announcements = res.announcements || [];
          this.cd.detectChanges();   // 🔥 FORCE UI UPDATE
        },
        error: (err) => {
          console.error('Announcement API Error:', err);
        }
      });
  }
}
