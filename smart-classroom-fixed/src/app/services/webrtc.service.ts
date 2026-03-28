import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface RemoteStreamEvent {
  socketId: string;
  stream: MediaStream;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' }
  ]
};

@Injectable({ providedIn: 'root' })
export class WebRtcService {

  localStream: MediaStream | null = null;
  peers: Map<string, RTCPeerConnection> = new Map();
  permissionError: string | null = null;
  cameraTrack: MediaStreamTrack | null = null;

  remoteStreams$ = new Subject<RemoteStreamEvent>();

  // Track renegotiation attempts per peer
  private renegotiationAttempts: Map<string, number> = new Map();

  async initLocalMedia(videoEnabled = true, audioEnabled = true): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      });
      this.localStream = stream;
      this.permissionError = null;
      return stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.permissionError = 'Camera/microphone access was denied. You may join in audio-only or view-only mode.';
        // Try audio-only fallback
        if (videoEnabled) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            this.localStream = audioStream;
            return audioStream;
          } catch {
            this.localStream = null;
            return null;
          }
        }
      } else {
        this.permissionError = 'Could not access media devices.';
      }
      this.localStream = null;
      return null;
    }
  }

  private createPeerConnection(targetSocketId: string, socket: any): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('iceCandidate', {
          targetSocketId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      this.remoteStreams$.next({ socketId: targetSocketId, stream });
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'failed') {
        const attempts = this.renegotiationAttempts.get(targetSocketId) ?? 0;
        if (attempts < 1) {
          this.renegotiationAttempts.set(targetSocketId, attempts + 1);
          // Attempt renegotiation by restarting ICE
          pc.restartIce();
        } else {
          this.removePeer(targetSocketId);
        }
      }
    };

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    this.peers.set(targetSocketId, pc);
    return pc;
  }

  async createOffer(targetSocketId: string, socket: any): Promise<void> {
    const pc = this.createPeerConnection(targetSocketId, socket);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', { targetSocketId, sdp: pc.localDescription });
  }

  async handleOffer(fromSocketId: string, sdp: RTCSessionDescriptionInit, socket: any): Promise<void> {
    const pc = this.createPeerConnection(fromSocketId, socket);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', { targetSocketId: fromSocketId, sdp: pc.localDescription });
  }

  async handleAnswer(fromSocketId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peers.get(fromSocketId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }

  async addIceCandidate(fromSocketId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peers.get(fromSocketId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      for (const track of this.localStream.getAudioTracks()) {
        track.enabled = enabled;
      }
    }
    for (const pc of this.peers.values()) {
      for (const sender of pc.getSenders()) {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = enabled;
        }
      }
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      for (const track of this.localStream.getVideoTracks()) {
        track.enabled = enabled;
      }
    }
    for (const pc of this.peers.values()) {
      for (const sender of pc.getSenders()) {
        if (sender.track && sender.track.kind === 'video') {
          sender.track.enabled = enabled;
        }
      }
    }
  }

  async startScreenShare(socket: any): Promise<void> {
    const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];

    // Store original camera track
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      this.cameraTrack = videoTracks.length > 0 ? videoTracks[0] : null;
    }

    // Replace video sender track on all peers
    for (const pc of this.peers.values()) {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }
    }

    // Stop screen track when user stops sharing via browser UI
    screenTrack.onended = () => {
      this.stopScreenShare();
    };
  }

  async stopScreenShare(): Promise<void> {
    if (!this.cameraTrack) return;
    for (const pc of this.peers.values()) {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) {
        await sender.replaceTrack(this.cameraTrack);
      }
    }
  }

  closeAll(): void {
    for (const pc of this.peers.values()) {
      pc.close();
    }
    this.peers.clear();
    this.renegotiationAttempts.clear();
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        track.stop();
      }
      this.localStream = null;
    }
  }

  removePeer(socketId: string): void {
    const pc = this.peers.get(socketId);
    if (pc) {
      pc.close();
      this.peers.delete(socketId);
      this.renegotiationAttempts.delete(socketId);
    }
  }

  setupReconnection(socket: any): void {
    const delays = [1000, 2000, 4000];
    let attempt = 0;

    const tryReconnect = () => {
      if (attempt >= delays.length) return;
      const delay = delays[attempt];
      attempt++;
      setTimeout(() => {
        if (!socket.connected) {
          socket.connect();
          if (!socket.connected) {
            tryReconnect();
          }
        }
      }, delay);
    };

    socket.on('disconnect', () => {
      attempt = 0;
      tryReconnect();
    });
  }
}
