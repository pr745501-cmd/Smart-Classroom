import { Component, Input, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
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
  connectionState?: RTCPeerConnectionState;
}

@Component({
  selector: 'app-meeting-room',
  standalone: true,
  imports: [CommonModule, SetStreamDirective],
  templateUrl: './meeting-room.html',
  styleUrls: ['./meeting-room.css']
})
export class MeetingRoomComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() sessionId: string = '';
  @Input() role: 'faculty' | 'student' = 'student';
  @Input() meetingCode: string = '';

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

  ngOnInit(): void {
    this.socketService.joinMeetingRoom(this.sessionId);

    // Subscribe to remote streams
    this.remoteStreamSub = this.webrtcService.remoteStreams$.subscribe(({ socketId, stream }) => {
      const existing = this.participants.find(p => p.socketId === socketId);
      if (existing) {
        existing.stream = stream;
      } else {
        this.participants.push({ socketId, userId: socketId, name: 'Participant', role: 'student', stream });
      }
      this.participants = [...this.participants];
      this.cdr.detectChanges();
    });

    // When WE join, get list of existing participants and create offers to them
    this.socketService.onExistingParticipants((participants: any[]) => {
      for (const p of participants) {
        if (!this.participants.find(x => x.socketId === p.socketId)) {
          this.participants.push({
            socketId: p.socketId,
            userId: p.userId || p.socketId,
            name: p.name || 'Participant',
            role: p.role || 'student'
          });
        }
        this.webrtcService.createOffer(p.socketId, this.socketService.socket);
      }
      this.cdr.detectChanges();
    });

    this.socketService.onParticipantJoined((data: any) => {
      if (!this.participants.find(p => p.socketId === data.socketId)) {
        this.participants.push({
          socketId: data.socketId,
          userId: data.userId || data.socketId,
          name: data.name || 'Participant',
          role: data.role || 'student'
        });
      }
      this.webrtcService.createOffer(data.socketId, this.socketService.socket);
      this.cdr.detectChanges();
    });

    this.socketService.onOffer((data: any) => {
      this.webrtcService.handleOffer(data.fromSocketId, data.sdp, this.socketService.socket);
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
      const dest = this.role === 'faculty' ? '/faculty' : '/dashboard';
      this.router.navigate([dest]);
    });

    this.socketService.onConnectError(() => {
      this.sessionExpired = true;
      this.webrtcService.closeAll();
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    // Init local media AFTER view is ready so localVideoRef is available
    this.webrtcService.initLocalMedia().then(stream => {
      this.permissionError = this.webrtcService.permissionError;
      if (stream && this.localVideoRef?.nativeElement) {
        this.localVideoRef.nativeElement.srcObject = stream;
        this.webrtcService.setLocalVideoElement(this.localVideoRef.nativeElement);
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.socketService.leaveMeetingRoom(this.sessionId);
    this.webrtcService.closeAll();
    this.remoteStreamSub?.unsubscribe();
    this.socketService.offEvent('existingParticipants');
    this.socketService.offEvent('participantJoined');
    this.socketService.offEvent('offer');
    this.socketService.offEvent('answer');
    this.socketService.offEvent('iceCandidate');
    this.socketService.offEvent('participantLeft');
    this.socketService.offEvent('meetingEnded');
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
    if (!this.screenSharing) {
      await this.webrtcService.startScreenShare(this.socketService.socket);
      this.screenSharing = true;
    } else {
      await this.webrtcService.stopScreenShare();
      this.screenSharing = false;
    }
  }

  endMeeting(): void {
    this.liveClassService.endClass().subscribe({
      next: () => {
        this.webrtcService.closeAll();
        this.router.navigate(['/faculty']);
      },
      error: () => {
        this.webrtcService.closeAll();
        this.router.navigate(['/faculty']);
      }
    });
  }

  leaveMeeting(): void {
    this.webrtcService.closeAll();
    this.router.navigate(['/dashboard']);
  }

  dismissSessionExpired(): void {
    this.router.navigate([this.role === 'faculty' ? '/faculty' : '/dashboard']);
  }

  getQualityClass(): string {
    return this.connectionQuality;
  }

  getStreamForParticipant(participant: Participant): MediaStream | undefined {
    return participant.stream;
  }

  setVideoElement(el: HTMLVideoElement, stream: MediaStream): void {
    if (el && el.srcObject !== stream) {
      el.srcObject = stream;
    }
  }
}
