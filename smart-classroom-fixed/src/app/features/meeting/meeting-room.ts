import {
  Component, Input, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, ChangeDetectorRef, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WebRtcService } from '../../core/services/webrtc.service';
import { SocketService } from '../../core/services/socket.service';
import { LiveClassService } from '../../core/services/live-class.service';
import { SetStreamDirective } from './set-stream.directive';

export interface Participant {
  socketId: string;
  userId: string;
  name: string;
  role: 'faculty' | 'student';
  stream?: MediaStream;
  /** Remote mic state (from signaling; defaults true) */
  remoteAudioOn?: boolean;
  /** Remote camera state */
  remoteVideoOn?: boolean;
  handRaised?: boolean;
}

export interface MeetingChatMessage {
  socketId: string;
  name: string;
  text: string;
  at: number;
}

@Component({
  selector: 'app-meeting-room',
  standalone: true,
  imports: [CommonModule, FormsModule, SetStreamDirective],
  templateUrl: './meeting-room.html',
  styleUrls: ['./meeting-room.css'],
  providers: [WebRtcService]
})
export class MeetingRoomComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() sessionId = '';
  @Input() role: 'faculty' | 'student' = 'student';
  @Input() meetingCode = '';
  @Input() meetingTitle = '';

  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('mainStage') mainStageRef!: ElementRef<HTMLDivElement>;
  @ViewChild('chatScroll') chatScrollRef!: ElementRef<HTMLDivElement>;

  participants: Participant[] = [];
  audioEnabled = true;
  videoEnabled = true;
  screenSharing = false;
  connectionQuality: 'good' | 'degraded' | 'poor' = 'good';
  permissionError: string | null = null;
  sessionExpired = false;
  showParticipants = false;
  showChat = false;
  layoutMode: 'gallery' | 'speaker' = 'speaker';
  /** Manual spotlight; null uses default (teacher for students, first student for faculty) */
  spotlightSocketId: string | null = null;

  chatMessages: MeetingChatMessage[] = [];
  chatInput = '';
  /** Unread count when chat panel is closed */
  chatUnreadCount = 0;
  /** Brief in-meeting alert for new messages from others */
  chatToast: { name: string; text: string } | null = null;
  selfHandRaised = false;
  copyHint = '';
  elapsedLabel = '0:00';

  private remoteStreamSub?: Subscription;
  private elapsedTimer: ReturnType<typeof setInterval> | null = null;
  private meetingStartedAt = 0;
  private copyHintTimer: ReturnType<typeof setTimeout> | null = null;
  private chatToastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    public webrtcService: WebRtcService,
    private socketService: SocketService,
    private liveClassService: LiveClassService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  get mySocketId(): string {
    return this.socketService.socket?.id ?? '';
  }

  get canPromptDesktopNotify(): boolean {
    return typeof Notification !== 'undefined' && Notification.permission === 'default';
  }

  get desktopNotifyEnabled(): boolean {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  }

  /** Main tile in speaker mode */
  get spotlight(): Participant | null {
    const list = this.participants;
    if (list.length === 0) return null;
    if (this.spotlightSocketId) {
      const picked = list.find(p => p.socketId === this.spotlightSocketId);
      if (picked) return picked;
    }
    if (this.role === 'student') {
      return list.find(p => p.role === 'faculty') ?? list[0];
    }
    return list.find(p => p.role === 'student') ?? list[0];
  }

  get filmstrip(): Participant[] {
    const s = this.spotlight;
    if (!s) return this.participants;
    return this.participants.filter(p => p.socketId !== s.socketId);
  }

  private offMeetingEvents(): void {
    this.socketService.offEvent('existingParticipants');
    this.socketService.offEvent('participantJoined');
    this.socketService.offEvent('offer');
    this.socketService.offEvent('answer');
    this.socketService.offEvent('iceCandidate');
    this.socketService.offEvent('participantLeft');
    this.socketService.offEvent('meetingEnded');
    this.socketService.offEvent('meetingChat');
    this.socketService.offEvent('meetingMediaState');
    this.socketService.offEvent('meetingRaiseHand');
    this.socketService.offEvent('meetingLowerHand');
  }

  private broadcastMediaState(): void {
    if (!this.sessionId) return;
    const hasLiveVideo = !!this.webrtcService.localStream?.getVideoTracks().some(
      t => t.readyState === 'live'
    );
    this.socketService.emitMeetingMediaState(
      this.sessionId,
      this.audioEnabled,
      this.videoEnabled && hasLiveVideo
    );
  }

  private scrollChatToEnd(): void {
    setTimeout(() => {
      const el = this.chatScrollRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  private startElapsedTimer(): void {
    this.meetingStartedAt = Date.now();
    this.elapsedTimer = setInterval(() => {
      const s = Math.floor((Date.now() - this.meetingStartedAt) / 1000);
      const m = Math.floor(s / 60);
      const sec = s % 60;
      this.elapsedLabel = `${m}:${sec.toString().padStart(2, '0')}`;
      this.cdr.markForCheck();
    }, 1000);
  }

  async ngOnInit(): Promise<void> {
    this.offMeetingEvents();

    this.webrtcService.setSocket(this.socketService.socket);

    await this.webrtcService.initLocalMedia();
    this.permissionError = this.webrtcService.permissionError;
    const hasVideo = !!this.webrtcService.localStream?.getVideoTracks().length;
    if (!hasVideo) this.videoEnabled = false;

    this.remoteStreamSub = this.webrtcService.remoteStreams$.subscribe(({ socketId, stream }) => {
      const p = this.participants.find(x => x.socketId === socketId);
      if (p) {
        p.stream = stream;
        this.participants = [...this.participants];
      }
      this.updateConnectionQualityFromPeers();
      this.cdr.detectChanges();
    });

    this.socketService.onExistingParticipants((list: any[]) => {
      for (const p of list) {
        this.addParticipant(p);
        this.webrtcService.initiateConnection(p.socketId);
      }
      this.cdr.detectChanges();
    });

    this.socketService.onParticipantJoined((data: any) => {
      this.addParticipant(data);
      this.webrtcService.initiateConnection(data.socketId);
      this.cdr.detectChanges();
    });

    this.socketService.onOffer((data: any) => {
      this.webrtcService.handleOffer(data.fromSocketId, data.sdp);
    });

    this.socketService.onAnswer((data: any) => {
      this.webrtcService.handleAnswer(data.fromSocketId, data.sdp);
    });

    this.socketService.onIceCandidate((data: any) => {
      this.webrtcService.addIceCandidate(data.fromSocketId, data.candidate);
    });

    this.socketService.onParticipantLeft((data: any) => {
      this.webrtcService.removePeer(data.socketId);
      if (this.spotlightSocketId === data.socketId) {
        this.spotlightSocketId = null;
      }
      this.participants = this.participants.filter(p => p.socketId !== data.socketId);
      this.cdr.detectChanges();
    });

    this.socketService.onMeetingEnded(() => {
      this.webrtcService.closeAll();
      this.router.navigate([this.role === 'faculty' ? '/faculty' : '/dashboard']);
    });

    this.socketService.onConnectError(() => {
      this.sessionExpired = true;
      this.webrtcService.closeAll();
      this.cdr.detectChanges();
    });

    this.socketService.onMeetingChat((msg) => {
      // Socket.io can run outside Angular's zone — wrap so the list updates without a full page refresh
      this.ngZone.run(() => {
        this.chatMessages = [...this.chatMessages, msg];
        const fromOther = msg.socketId !== this.mySocketId;
        if (fromOther) {
          if (!this.showChat) {
            this.chatUnreadCount++;
          }
          const tabHidden = typeof document !== 'undefined' && document.hidden;
          if (!this.showChat || tabHidden) {
            this.flashChatToast(msg);
            this.pushBrowserNotification(msg);
          }
        }
        this.scrollChatToEnd();
        this.cdr.detectChanges();
      });
    });

    this.socketService.onMeetingMediaState((data) => {
      const p = this.participants.find(x => x.socketId === data.socketId);
      if (p) {
        p.remoteAudioOn = data.audioEnabled;
        p.remoteVideoOn = data.videoEnabled;
        this.participants = [...this.participants];
      }
      this.cdr.detectChanges();
    });

    this.socketService.onMeetingRaiseHand((data) => {
      const p = this.participants.find(x => x.socketId === data.socketId);
      if (p) {
        p.handRaised = true;
        this.participants = [...this.participants];
      }
      this.cdr.detectChanges();
    });

    this.socketService.onMeetingLowerHand((data) => {
      const p = this.participants.find(x => x.socketId === data.socketId);
      if (p) {
        p.handRaised = false;
        this.participants = [...this.participants];
      }
      this.cdr.detectChanges();
    });

    this.socketService.joinMeetingRoom(this.sessionId);
    this.startElapsedTimer();
    queueMicrotask(() => this.broadcastMediaState());
  }

  ngAfterViewInit(): void {
    const el = this.localVideoRef?.nativeElement;
    if (el) {
      this.webrtcService.setLocalVideoElement(el);
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.selfHandRaised && this.sessionId) {
      this.socketService.emitMeetingLowerHand(this.sessionId);
    }
    this.offMeetingEvents();
    this.remoteStreamSub?.unsubscribe();
    if (this.elapsedTimer) clearInterval(this.elapsedTimer);
    if (this.copyHintTimer) clearTimeout(this.copyHintTimer);
    if (this.chatToastTimer) clearTimeout(this.chatToastTimer);
    this.socketService.leaveMeetingRoom(this.sessionId);
    this.webrtcService.closeAll();
  }

  private addParticipant(data: any): void {
    if (!this.participants.find(p => p.socketId === data.socketId)) {
      this.participants.push({
        socketId: data.socketId,
        userId: data.userId || data.socketId,
        name: data.name || 'Participant',
        role: data.role || 'student',
        remoteAudioOn: true,
        remoteVideoOn: true,
        handRaised: false
      });
    }
  }

  private updateConnectionQualityFromPeers(): void {
    // Lightweight placeholder: real Zoom apps use bitrate stats; mesh with STUN is usually "good" on LAN
    const n = this.webrtcService.peers.size;
    if (n <= 2) this.connectionQuality = 'good';
    else if (n <= 5) this.connectionQuality = 'degraded';
    else this.connectionQuality = 'poor';
  }

  toggleAudio(): void {
    this.audioEnabled = !this.audioEnabled;
    this.webrtcService.toggleAudio(this.audioEnabled);
    this.broadcastMediaState();
  }

  toggleVideo(): void {
    this.videoEnabled = !this.videoEnabled;
    this.webrtcService.toggleVideo(this.videoEnabled);
    this.broadcastMediaState();
  }

  async toggleScreenShare(): Promise<void> {
    try {
      if (!this.screenSharing) {
        await this.webrtcService.startScreenShare();
        this.screenSharing = true;
      } else {
        await this.webrtcService.stopScreenShare();
        this.screenSharing = false;
      }
    } catch {
      this.screenSharing = false;
    }
  }

  selectSpotlight(socketId: string): void {
    this.spotlightSocketId = socketId;
  }

  toggleLayout(): void {
    this.layoutMode = this.layoutMode === 'gallery' ? 'speaker' : 'gallery';
  }

  async copyMeetingCode(): Promise<void> {
    if (!this.meetingCode) return;
    try {
      await navigator.clipboard.writeText(this.meetingCode);
      this.copyHint = 'Invite code copied';
    } catch {
      this.copyHint = 'Copy failed — select code manually';
    }
    if (this.copyHintTimer) clearTimeout(this.copyHintTimer);
    this.copyHintTimer = setTimeout(() => {
      this.copyHint = '';
      this.cdr.detectChanges();
    }, 2200);
    this.cdr.detectChanges();
  }

  async toggleMainFullscreen(): Promise<void> {
    const el = this.mainStageRef?.nativeElement;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* ignore */
    }
  }

  sendChat(): void {
    const text = this.chatInput.trim();
    if (!text || !this.sessionId) return;
    this.socketService.emitMeetingChat(this.sessionId, text);
    this.chatInput = '';
  }

  toggleChat(): void {
    const opening = !this.showChat;
    this.showChat = opening;
    if (opening) {
      this.chatUnreadCount = 0;
      this.clearChatToast();
      queueMicrotask(() => this.scrollChatToEnd());
    }
    this.cdr.detectChanges();
  }

  closeChatPanel(): void {
    this.showChat = false;
    this.cdr.detectChanges();
  }

  requestDesktopNotifications(): void {
    if (typeof Notification === 'undefined') return;
    Notification.requestPermission().then(() => this.cdr.detectChanges());
  }

  openChatFromToast(): void {
    this.showChat = true;
    this.chatUnreadCount = 0;
    this.clearChatToast();
    queueMicrotask(() => this.scrollChatToEnd());
    this.cdr.detectChanges();
  }

  dismissChatToast(event: Event): void {
    event.stopPropagation();
    this.clearChatToast();
    this.cdr.detectChanges();
  }

  private clearChatToast(): void {
    if (this.chatToastTimer) {
      clearTimeout(this.chatToastTimer);
      this.chatToastTimer = null;
    }
    this.chatToast = null;
  }

  private flashChatToast(msg: MeetingChatMessage): void {
    const snippet = msg.text.length > 100 ? `${msg.text.slice(0, 100)}…` : msg.text;
    if (this.chatToastTimer) {
      clearTimeout(this.chatToastTimer);
    }
    this.chatToast = { name: msg.name, text: snippet };
    this.chatToastTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.chatToast = null;
        this.chatToastTimer = null;
        this.cdr.detectChanges();
      });
    }, 6000);
  }

  private pushBrowserNotification(msg: MeetingChatMessage): void {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }
    try {
      new Notification(`Meeting chat: ${msg.name}`, {
        body: msg.text.slice(0, 200),
        tag: `smartclass-meet-chat-${msg.at}`
      });
    } catch {
      /* ignore */
    }
  }

  toggleRaiseHand(): void {
    if (!this.sessionId) return;
    if (this.selfHandRaised) {
      this.socketService.emitMeetingLowerHand(this.sessionId);
      this.selfHandRaised = false;
    } else {
      this.socketService.emitMeetingRaiseHand(this.sessionId);
      this.selfHandRaised = true;
    }
  }

  showRemoteAvatar(p: Participant): boolean {
    if (!p.stream) return true;
    return p.remoteVideoOn === false;
  }

  endMeeting(): void {
    this.liveClassService.endClass().subscribe({
      next: () => { this.webrtcService.closeAll(); this.router.navigate(['/faculty']); },
      error: () => { this.webrtcService.closeAll(); this.router.navigate(['/faculty']); }
    });
  }

  leaveMeeting(): void {
    this.webrtcService.closeAll();
    this.router.navigate(['/dashboard']);
  }

  dismissSessionExpired(): void {
    this.router.navigate([this.role === 'faculty' ? '/faculty' : '/dashboard']);
  }
}
