import {
  Component, Input, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WebRtcService } from '../services/webrtc.service';
import { SocketService } from '../services/socket.service';
import { LiveClassService } from '../services/live-class.service';
import { SetStreamDirective } from './set-stream.directive';

export interface Participant {
  socketId: string;
  userId: string;
  name: string;
  role: 'faculty' | 'student';
  stream?: MediaStream;
}

@Component({
  selector: 'app-meeting-room',
  standalone: true,
  imports: [CommonModule, SetStreamDirective],
  templateUrl: './meeting-room.html',
  styleUrls: ['./meeting-room.css'],
  providers: [WebRtcService]
})
export class MeetingRoomComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() sessionId = '';
  @Input() role: 'faculty' | 'student' = 'student';
  @Input() meetingCode = '';

  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;

  participants: Participant[] = [];
  audioEnabled = true;
  videoEnabled = true;
  screenSharing = false;
  connectionQuality: 'good' | 'degraded' | 'poor' = 'good';
  permissionError: string | null = null;
  sessionExpired = false;
  showParticipants = false;

  private remoteStreamSub?: Subscription;

  constructor(
    public webrtcService: WebRtcService,
    private socketService: SocketService,
    private liveClassService: LiveClassService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  private offMeetingEvents(): void {
    this.socketService.offEvent('existingParticipants');
    this.socketService.offEvent('participantJoined');
    this.socketService.offEvent('offer');
    this.socketService.offEvent('answer');
    this.socketService.offEvent('iceCandidate');
    this.socketService.offEvent('participantLeft');
    this.socketService.offEvent('meetingEnded');
  }

  async ngOnInit(): Promise<void> {
    // Clean up any stale listeners first
    this.offMeetingEvents();

    // Give the service a reference to the socket for signaling
    this.webrtcService.setSocket(this.socketService.socket);

    // Init local media before joining so tracks are ready when offers are created
    await this.webrtcService.initLocalMedia();
    this.permissionError = this.webrtcService.permissionError;

    // Subscribe to remote stream updates
    this.remoteStreamSub = this.webrtcService.remoteStreams$.subscribe(({ socketId, stream }) => {
      const p = this.participants.find(x => x.socketId === socketId);
      if (p) {
        p.stream = stream;
        this.participants = [...this.participants];
      }
      this.cdr.detectChanges();
    });

    // Register signaling handlers
    this.socketService.onExistingParticipants((list: any[]) => {
      for (const p of list) {
        this.addParticipant(p);
        // We initiate the connection to existing participants
        this.webrtcService.initiateConnection(p.socketId);
      }
      this.cdr.detectChanges();
    });

    this.socketService.onParticipantJoined((data: any) => {
      this.addParticipant(data);
      // We initiate the connection to the new participant
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

    // Join the meeting room — server will send existingParticipants + participantJoined to others
    this.socketService.joinMeetingRoom(this.sessionId);
  }

  ngAfterViewInit(): void {
    const el = this.localVideoRef?.nativeElement;
    if (el) {
      this.webrtcService.setLocalVideoElement(el);
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.offMeetingEvents();
    this.remoteStreamSub?.unsubscribe();
    this.socketService.leaveMeetingRoom(this.sessionId);
    this.webrtcService.closeAll();
  }

  private addParticipant(data: any): void {
    if (!this.participants.find(p => p.socketId === data.socketId)) {
      this.participants.push({
        socketId: data.socketId,
        userId: data.userId || data.socketId,
        name: data.name || 'Participant',
        role: data.role || 'student'
      });
    }
  }

  toggleAudio(): void {
    this.audioEnabled = !this.audioEnabled;
    this.webrtcService.toggleAudio(this.audioEnabled);
  }

  toggleVideo(): void {
    this.videoEnabled = !this.videoEnabled;
    this.webrtcService.toggleVideo(this.videoEnabled);
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
    } catch (err) {
      // User cancelled screen share picker
      this.screenSharing = false;
    }
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
