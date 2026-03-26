import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DmChatService, StudentContact } from '../../services/dm-chat.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-faculty-contacts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faculty-contacts.component.html',
  styleUrls: ['./faculty-contacts.component.css']
})
export class FacultyContactsComponent implements OnInit, OnDestroy {
  contacts: StudentContact[] = [];

  constructor(
    private dmChatService: DmChatService,
    private socketService: SocketService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.dmChatService.getStudentContacts().subscribe(data => {
      this.contacts = data;
      this.cd.detectChanges();
    });

    this.socketService.onUserOnline((data: { userId: string }) => {
      const contact = this.contacts.find(c => c._id === data.userId);
      if (contact) {
        contact.isOnline = true;
        contact.lastSeen = null;
      }
    });

    this.socketService.onUserOffline((data: { userId: string; lastSeen: string }) => {
      const contact = this.contacts.find(c => c._id === data.userId);
      if (contact) {
        contact.isOnline = false;
        contact.lastSeen = data.lastSeen;
      }
    });
  }

  ngOnDestroy(): void {
    this.socketService.offEvent('userOnline');
    this.socketService.offEvent('userOffline');
  }

  getInitials(name: string): string {
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '';
    const first = words[0][0] ?? '';
    const last = words.length > 1 ? words[words.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  formatLastSeen(lastSeen: string | null): string {
    if (!lastSeen) return '';
    const date = new Date(lastSeen);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    const timeStr = this.formatTime(lastSeen);
    if (isToday) {
      return `Last seen today at ${timeStr}`;
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return `Last seen yesterday at ${timeStr}`;
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    return `Last seen ${month} ${day} at ${timeStr}`;
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  openChat(contactId: string): void {
    this.router.navigate(['/dm', contactId]);
  }

  trackContact(_index: number, contact: StudentContact): string {
    return contact._id;
  }
}
