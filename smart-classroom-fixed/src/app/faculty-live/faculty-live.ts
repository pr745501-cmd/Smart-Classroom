import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LiveClassService } from '../services/live-class.service';

@Component({
  selector: 'app-faculty-live',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faculty-live.html',
  styleUrls: ['./faculty-live.css']
})
export class FacultyLive {

  title = '';
  link = '';
  loading = false;
  isLive = false;

  constructor(
    private live: LiveClassService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  goBack(): void {
    this.router.navigate(['/faculty']);
  }

  start() {
    if (!this.title || !this.link) {
      alert("Enter title and link");
      return;
    }
    this.loading = true;
    this.live.startClass({
      title: this.title,
      meetingLink: this.link,
      facultyName: "Faculty"
    }).subscribe(() => {
      alert("Live class started ✅");
      this.loading = false;
      this.isLive = true;
      this.cdr.detectChanges();
    });
  }

  end() {
    this.live.endClass().subscribe(() => {
      alert("Class ended ❌");
      this.isLive = false;
      this.cdr.detectChanges();
    });
  }
}
