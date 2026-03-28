import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../services/socket.service';

/** Saved lecture chat document shape from API / socket */
export interface LectureChatMessage {
  _id?: string;
  senderName?: string;
  senderRole?: string;
  message?: string;
  createdAt?: string | Date;
  lectureId?: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class Chat implements OnInit, OnDestroy {

  message = '';
  lectureId = 'classroom';
  messages: LectureChatMessage[] = [];
  user: { name?: string; role?: string } = {};

  @ViewChild('scrollContainer') scroll!: ElementRef;

  private readonly onChatHistory = (history: LectureChatMessage[]) => {
    this.ngZone.run(() => {
      this.messages = history;
      this.cd.detectChanges();
      this.scrollDown();
    });
  };

  private readonly onReceiveMessage = (data: LectureChatMessage) => {
    this.ngZone.run(() => {
      this.messages = [...this.messages, data];
      this.cd.detectChanges();
      this.scrollDown();
    });
  };

  private readonly onSocketConnect = () => {
    this.ngZone.run(() => {
      this.socketService.joinRoom(this.lectureId);
    });
  };

  constructor(
    private cd: ChangeDetectorRef,
    private ngZone: NgZone,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    const s = this.socketService.socket;
    s.on('chatHistory', this.onChatHistory);
    s.on('receiveMessage', this.onReceiveMessage);
    s.on('connect', this.onSocketConnect);

    if (s.connected) {
      this.socketService.joinRoom(this.lectureId);
    }
  }

  ngOnDestroy(): void {
    const s = this.socketService.socket;
    s.off('chatHistory', this.onChatHistory);
    s.off('receiveMessage', this.onReceiveMessage);
    s.off('connect', this.onSocketConnect);
  }

  sendMessage(): void {
    if (!this.message.trim()) return;
    const data = {
      lectureId: this.lectureId,
      senderName: this.user.name,
      senderRole: this.user.role,
      message: this.message.trim()
    };
    this.socketService.sendMessage(data);
    this.message = '';
  }

  scrollDown(): void {
    setTimeout(() => {
      if (this.scroll?.nativeElement) {
        this.scroll.nativeElement.scrollTop = this.scroll.nativeElement.scrollHeight;
      }
    }, 10);
  }

  trackMsg(index: number, item: LectureChatMessage): string | number {
    return item._id ?? index;
  }
}
