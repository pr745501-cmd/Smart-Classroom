import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AssignmentService } from '../services/assignment.service';
import { AnnouncementService } from '../services/announcement.service';
import { LiveClassService } from '../services/live-class.service';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-faculty',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './faculty.html',
  styleUrls: ['./faculty.css']
})
export class Faculty implements OnInit, OnDestroy {

  faculty = { name: '', email: '' };
  today = new Date();

  totalAssignments = 0;
  totalAnnouncements = 0;
  totalLectures = 0;
  totalStudents = 0;

  recentAssignments: any[] = [];
  recentAnnouncements: any[] = [];
  liveClass: any = null;

  loading = true;
  private _pending = 4; // number of parallel calls

  constructor(
    private router: Router,
    private http: HttpClient,
    private assignmentService: AssignmentService,
    private announcementService: AnnouncementService,
    private liveService: LiveClassService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.faculty.name  = user.name  || 'Faculty';
    this.faculty.email = user.email || 'N/A';
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  private done() {
    this._pending--;
    if (this._pending <= 0) {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  loadDashboardData() {
    const name = this.faculty.name;

    // 1. Assignments
    this.assignmentService.getFacultyAssignments(name).subscribe({
      next: res => {
        const list = res.assignments || [];
        this.totalAssignments = list.length;
        this.recentAssignments = list.slice(0, 4);
        this.cdr.detectChanges();
        this.done();
      },
      error: () => this.done()
    });

    // 2. Announcements
    this.announcementService.getFacultyAnnouncements(name).subscribe({
      next: res => {
        const list = res.announcements || [];
        this.totalAnnouncements = list.length;
        this.recentAnnouncements = list.slice(0, 3);
        this.cdr.detectChanges();
        this.done();
      },
      error: () => this.done()
    });

    // 3. Lectures
    this.http.get<any>('http://localhost:5000/api/lectures').subscribe({
      next: res => {
        const all = res.lectures || [];
        this.totalLectures = all.filter((l: any) => l.faculty === name).length;
        this.cdr.detectChanges();
        this.done();
      },
      error: () => this.done()
    });

    // 4. Students
    this.http.get<any>('http://localhost:5000/api/students/enrolled').subscribe({
      next: res => {
        this.totalStudents = (res.students || []).length;
        this.cdr.detectChanges();
        this.done();
      },
      error: () => this.done()
    });

    // Live class (non-blocking — doesn't affect loading state)
    this.liveService.getLiveClass().subscribe({
      next: res => {
        this.liveClass = res;
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    // Keep live class status in sync via Socket.io
    this.socketService.onMeetingStarted((data: any) => {
      this.liveClass = data;
      this.cdr.detectChanges();
    });
    this.socketService.onMeetingEnded(() => {
      this.liveClass = null;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.socketService.offEvent('meetingStarted');
    this.socketService.offEvent('meetingEnded');
  }

  getDaysUntilDue(dueDate: string): string {
    const diff = new Date(dueDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days left`;
  }

  getDueClass(dueDate: string): string {
    const diff = new Date(dueDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'overdue';
    if (days <= 2) return 'soon';
    return 'ok';
  }

  logout() { localStorage.clear(); this.router.navigate(['/login']); }
  goTo(path: string) { this.router.navigate([path]); }
}
