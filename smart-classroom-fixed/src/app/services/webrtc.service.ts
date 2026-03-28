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
  // Keep one MediaStream per remote peer so tracks accumulate correctly
  private remoteStreamsMap: Map<string, MediaStream> = new Map();
  permissionError: string | null = null;
  cameraTrack: MediaStreamTrack | null = null;
  private localVideoEl: HTMLVideoElement | null = null;

  remoteStreams$ = new Subject<RemoteStreamEvent>();

  private renegotiationAttempts: Map<string, number> = new Map();

  // ── Local Media ────────────────────────────────────────────────────────────

  async initLocalMedia(videoEnabled = true, audioEnabled = true): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: videoEnabled, audio: audioEnabled });
      this.localStream = stream;
      this.permissionError = null;
      return stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.permissionError = 'Camera/microphone access was denied.';
        if (videoEnabled) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            this.localStream = audioStream;
            return audioStream;
          } catch { this.localStream = null; return null; }
        }
      } else {
        this.permissionError = 'Could not access media devices.';
      }
      this.localStream = null;
      return null;
    }
  }

  setLocalVideoElement(el: HTMLVideoElement): void {
    this.localVideoEl = el;
  }

  // ── Peer Connection ────────────────────────────────────────────────────────

  private createPeerConnection(targetSocketId: string, socket: any): RTCPeerConnection {
    // Close existing if any
    const existing = this.peers.get(targetSocketId);
    if (existing) { existing.close(); }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Ensure a MediaStream exists for this peer
    if (!this.remoteStreamsMap.has(targetSocketId)) {
      this.remoteStreamsMap.set(targetSocketId, new MediaStream());
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('iceCandidate', { targetSocketId, candidate: event.candidate.toJSON() });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = this.remoteStreamsMap.get(targetSocketId)!;
      // Add track if not already present
      const existingTrack = remoteStream.getTracks().find(t => t.id === event.track.id);
      if (!existingTrack) {
        remoteStream.addTrack(event.track);
      }
      // Emit every time so the video element gets updated
      this.remoteStreams$.next({ socketId: targetSocketId, stream: remoteStream });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        const attempts = this.renegotiationAttempts.get(targetSocketId) ?? 0;
        if (attempts < 2) {
          this.renegotiationAttempts.set(targetSocketId, attempts + 1);
          pc.restartIce();
        } else {
          this.removePeer(targetSocketId);
        }
      }
    };

    // Add local tracks
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    this.peers.set(targetSocketId, pc);
    return pc;
  }

  // ── Signaling ──────────────────────────────────────────────────────────────

  async createOffer(targetSocketId: string, socket: any): Promise<void> {
    const pc = this.createPeerConnection(targetSocketId, socket);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', { targetSocketId, sdp: pc.localDescription });
  }

  async handleOffer(fromSocketId: string, sdp: RTCSessionDescriptionInit, socket: any): Promise<void> {
    let pc = this.peers.get(fromSocketId);
    if (!pc || pc.signalingState === 'closed') {
      pc = this.createPeerConnection(fromSocketId, socket);
    }
    if (pc.signalingState !== 'stable') return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', { targetSocketId: fromSocketId, sdp: pc.localDescription });
  }

  async handleAnswer(fromSocketId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peers.get(fromSocketId);
    if (pc && pc.signalingState === 'have-local-offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }

  async addIceCandidate(fromSocketId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peers.get(fromSocketId);
    if (pc && pc.remoteDescription && pc.signalingState !== 'closed') {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch { /* ignore stale candidates */ }
    }
  }

  // ── Media Controls ─────────────────────────────────────────────────────────

  toggleAudio(enabled: boolean): void {
    this.localStream?.getAudioTracks().forEach(t => t.enabled = enabled);
  }

  toggleVideo(enabled: boolean): void {
    this.localStream?.getVideoTracks().forEach(t => t.enabled = enabled);
  }

  // ── Screen Share ───────────────────────────────────────────────────────────

  async startScreenShare(socket: any): Promise<void> {
    const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    });
    const screenTrack = screenStream.getVideoTracks()[0];

    // Save camera track for restore
    this.cameraTrack = this.localStream?.getVideoTracks()[0] ?? null;

    // Replace video track in local stream so local preview updates
    if (this.localStream && this.cameraTrack) {
      this.localStream.removeTrack(this.cameraTrack);
      this.localStream.addTrack(screenTrack);
    }

    // Update local video element preview
    if (this.localVideoEl) {
      this.localVideoEl.srcObject = this.localStream;
    }

    // Replace sender track on all peers
    for (const pc of this.peers.values()) {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);
    }

    // Auto-stop when user clicks browser's "Stop sharing"
    screenTrack.onended = () => { this.stopScreenShare(); };
  }

  async stopScreenShare(): Promise<void> {
    if (!this.cameraTrack) return;

    // Restore camera track in local stream
    if (this.localStream) {
      const screenTrack = this.localStream.getVideoTracks()[0];
      if (screenTrack) this.localStream.removeTrack(screenTrack);
      this.localStream.addTrack(this.cameraTrack);
    }

    // Update local video element preview
    if (this.localVideoEl) {
      this.localVideoEl.srcObject = this.localStream;
    }

    // Restore sender track on all peers
    for (const pc of this.peers.values()) {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(this.cameraTrack);
    }

    this.cameraTrack = null;
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  removePeer(socketId: string): void {
    this.peers.get(socketId)?.close();
    this.peers.delete(socketId);
    this.remoteStreamsMap.delete(socketId);
    this.renegotiationAttempts.delete(socketId);
  }

  closeAll(): void {
    for (const pc of this.peers.values()) pc.close();
    this.peers.clear();
    this.remoteStreamsMap.clear();
    this.renegotiationAttempts.clear();
    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = null;
    this.localVideoEl = null;
  }
}
