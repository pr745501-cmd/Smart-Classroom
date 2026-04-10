import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { filterByFaculty } from '../dashboard/admin-utils';

@Component({
  selector: 'app-admin-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-announcements.html',
  styleUrls: ['./admin-announcements.css']
})
export class AdminAnnouncementsComponent implements OnInit {
  admin: any = {};
  announcements: any[] = [];
  filtered: any[] = [];
  filterText = '';
  loading = true;
  error = false;
  deleteError = '';

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit() {
    this.admin = JSON.parse(localStorage.getItem('user') || '{}');
    this.adminService.getAnnouncements().subscribe({
      next: (res: any) => {
        this.announcements = res.announcements || res || [];
        this.filtered = [...this.announcements];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.error = true; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter() {
    this.filtered = filterByFaculty(this.announcements, this.filterText);
    this.cdr.detectChanges();
  }

  deleteItem(id: string) {
    if (!confirm('Delete this announcement?')) return;
    this.adminService.deleteAnnouncement(id).subscribe({
      next: () => {
        this.announcements = this.announcements.filter(a => a._id !== id);
        this.filtered = this.filtered.filter(a => a._id !== id);
        this.cdr.detectChanges();
      },
      error: () => { this.deleteError = 'Failed to delete announcement'; this.cdr.detectChanges(); }
    });
  }

  isActive(path: string) { return this.router.url === path; }
  goTo(path: string)     { this.router.navigate([path]); }
  logout()               { localStorage.clear(); this.router.navigate(['/login']); }
}
