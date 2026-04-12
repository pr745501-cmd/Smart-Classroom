import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DmChatService, StudentContact, DmInboxUpdatePayload } from '../../../../core/services/dm-chat.service';
import { SocketService } from '../../../../core/services/socket.service';

@Component({
  selector: 'app-faculty-contacts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faculty-contacts.component.html',
  styleUrls: ['./faculty-contacts.component.css']
})
export class FacultyContactsComponent implements OnInit, OnDestroy {
  contacts: StudentContact[] = [];

  private readonly onUserOnlineList = (data: { userId: string }) => {
    this.ngZone.run(() => {
      const contact = this.contacts.find(c => String(c._id) === String(data.userId));
      if (contact) {
        contact.isOnline = true;
        contact.lastSeen = null;
        this.cd.detectChanges();
      }
    });
  };

  private readonly onUserOfflineList = (data: { userId: string; lastSeen: string }) => {
    this.ngZone.run(() => {
      const contact = this.contacts.find(c => String(c._id) === String(data.userId));
      if (contact) {
        contact.isOnline = false;
        contact.lastSeen = data.lastSeen;
        this.cd.detectChanges();
      }
    });
  };

  private readonly onDmInbox = (payload: DmInboxUpdatePayload) => {
    this.ngZone.run(() => this.applyInboxUpdate(payload));
  };

  constructor(
    private dmChatService: DmChatService,
    private socketService: SocketService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.dmChatService.getStudentContacts().subscribe(data => {
      this.contacts = data;
      this.cd.detectChanges();
    });

    const s = this.socketService.socket;
    s.on('userOnline', this.onUserOnlineList);
    s.on('userOffline', this.onUserOfflineList);
    s.on('dmInboxUpdate', this.onDmInbox);
  }

  private applyInboxUpdate(payload: DmInboxUpdatePayload): void {
    if (payload.resetUnread) {
      const c = this.contacts.find(x => String(x._id) === String(payload.peerId));
      if (c) c.unreadCount = 0;
      this.cd.detectChanges();
      return;
    }
    if (!payload.lastMessage) return;

    let c = this.contacts.find(x => String(x._id) === String(payload.peerId));
    if (!c) {
      this.dmChatService.getStudentContacts().subscribe(data => {
        this.contacts = data;
        this.cd.detectChanges();
      });
      return;
    }

    c.lastMessage = {
      text: payload.lastMessage.text,
      timestamp: this.normalizeTs(payload.lastMessage.timestamp)
    };
    if (payload.incrementUnread) {
      c.unreadCount = (c.unreadCount || 0) + 1;
    }
    this.sortContactsByRecent();
    this.cd.detectChanges();
  }

  private normalizeTs(ts: string | Date): string {
    if (ts instanceof Date) return ts.toISOString();
    return String(ts);
  }

  private sortContactsByRecent(): void {
    this.contacts = [...this.contacts].sort((a, b) => {
      const ta = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const tb = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return tb - ta;
    });
  }

  ngOnDestroy(): void {
    const s = this.socketService.socket;
    s.off('userOnline', this.onUserOnlineList);
    s.off('userOffline', this.onUserOfflineList);
    s.off('dmInboxUpdate', this.onDmInbox);
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
