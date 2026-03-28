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
  ],
  iceCandidatePoolSize: 10
};

interface PeerState {
  pc: RTCPeerConnection;
  makingOffer: boolean;
  ignoreOffer: boolean;
  isSettingRemoteAnswerPending: boolean;
  polite: boolean; // polite peer yields on glare
}

@Injectable()
export class WebRtcService {

  localStream: MediaStream | null = null;
  permissionError: string | null = null;
  cameraTrack: MediaStreamTrack | null = null;

  private peerStates: Map<string, PeerState> = new Map();
  private remoteStreamsMap: Map<string, MediaStream> = new Map();
  private localVideoEl: HTMLVideoElement | null = null;
  private socket: any = null;

  remoteStreams$ = new Subject<RemoteStreamEvent>();

  // ── Local Media ────────────────────────────────────────────────────────────

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
        this.permissionError = 'Camera/microphone access was denied.';
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          this.localStream = audioOnly;
          return audioOnly;
        } catch {
          this.localStream = null;
          return null;
        }
      }
      this.permissionError = 'Could not access media devices.';
      this.localStream = null;
      return null;
    }
  }

  setLocalVideoElement(el: HTMLVideoElement): void {
    this.localVideoEl = el;
    if (this.localStream && el) {
      el.srcObject = this.localStream;
    }
  }

  setSocket(socket: any): void {
    this.socket = socket;
  }

  // ── Peer Connection (Perfect Negotiation Pattern) ──────────────────────────

  private getOrCreatePeer(remoteSocketId: string, polite: boolean): PeerState {
    const existing = this.peerStates.get(remoteSocketId);
    if (existing && existing.pc.signalingState !== 'closed') {
      return existing;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    if (!this.remoteStreamsMap.has(remoteSocketId)) {
      this.remoteStreamsMap.set(remoteSocketId, new MediaStream());
    }

    const state: PeerState = {
      pc,
      makingOffer: false,
      ignoreOffer: false,
      isSettingRemoteAnswerPending: false,
      polite
    };

    this.peerStates.set(remoteSocketId, state);

    // Add local tracks
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    // Perfect negotiation: onnegotiationneeded handles offer creation
    pc.onnegotiationneeded = async () => {
      try {
        state.makingOffer = true;
        await pc.setLocalDescription();
        this.socket?.emit('offer', {
          targetSocketId: remoteSocketId,
          sdp: pc.localDescription
        });
      } catch (err) {
        console.error('onnegotiationneeded error:', err);
      } finally {
        state.makingOffer = false;
      }
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.socket?.emit('iceCandidate', {
          targetSocketId: remoteSocketId,
          candidate: candidate.toJSON()
        });
      }
    };

    pc.ontrack = ({ track, streams }) => {
      const remoteStream = this.remoteStreamsMap.get(remoteSocketId)!;
      const existing = remoteStream.getTracks().find(t => t.id === track.id);
      if (!existing) {
        remoteStream.addTrack(track);
      }
      this.remoteStreams$.next({ socketId: remoteSocketId, stream: remoteStream });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        pc.restartIce();
      }
      if (pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
        // Will be cleaned up on participantLeft
      }
    };

    return state;
  }

  // ── Called when a new participant joins (we initiate) ─────────────────────

  initiateConnection(remoteSocketId: string): void {
    // We are impolite (we initiated), remote is polite
    this.getOrCreatePeer(remoteSocketId, false);
    // onnegotiationneeded fires automatically after addTrack
  }

  // ── Signaling ──────────────────────────────────────────────────────────────

  async handleOffer(fromSocketId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    // We are polite when receiving an offer we didn't initiate
    const state = this.getOrCreatePeer(fromSocketId, true);
    const pc = state.pc;

    const offerCollision =
      sdp.type === 'offer' &&
      (state.makingOffer || pc.signalingState !== 'stable');

    state.ignoreOffer = !state.polite && offerCollision;
    if (state.ignoreOffer) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));

      if (sdp.type === 'offer') {
        await pc.setLocalDescription();
        this.socket?.emit('answer', {
          targetSocketId: fromSocketId,
          sdp: pc.localDescription
        });
      }
    } catch (err) {
      console.error('handleOffer error:', err);
    }
  }

  async handleAnswer(fromSocketId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const state = this.peerStates.get(fromSocketId);
    if (!state) return;
    try {
      state.isSettingRemoteAnswerPending = true;
      await state.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch (err) {
      console.error('handleAnswer error:', err);
    } finally {
      state.isSettingRemoteAnswerPending = false;
    }
  }

  async addIceCandidate(fromSocketId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const state = this.peerStates.get(fromSocketId);
    if (!state) return;
    try {
      await state.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      if (!state.ignoreOffer) {
        console.error('addIceCandidate error:', err);
      }
    }
  }

  // ── Media Controls ─────────────────────────────────────────────────────────

  toggleAudio(enabled: boolean): void {
    this.localStream?.getAudioTracks().forEach(t => (t.enabled = enabled));
  }

  toggleVideo(enabled: boolean): void {
    this.localStream?.getVideoTracks().forEach(t => (t.enabled = enabled));
  }

  // ── Screen Share ───────────────────────────────────────────────────────────

  async startScreenShare(): Promise<void> {
    const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    });
    const screenTrack = screenStream.getVideoTracks()[0];

    // Save camera track for restore
    this.cameraTrack = this.localStream?.getVideoTracks()[0] ?? null;

    // Replace video track in local stream
    if (this.localStream) {
      if (this.cameraTrack) this.localStream.removeTrack(this.cameraTrack);
      this.localStream.addTrack(screenTrack);
    } else {
      this.localStream = new MediaStream([screenTrack]);
    }

    // Update local preview
    if (this.localVideoEl) {
      this.localVideoEl.srcObject = this.localStream;
    }

    // Replace sender track on all peers — onnegotiationneeded handles renegotiation
    for (const state of this.peerStates.values()) {
      const sender = state.pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      } else {
        // No video sender yet — addTrack triggers onnegotiationneeded automatically
        state.pc.addTrack(screenTrack, this.localStream!);
      }
    }

    screenTrack.onended = () => this.stopScreenShare();
  }

  async stopScreenShare(): Promise<void> {
    if (!this.cameraTrack) return;

    const screenTrack = this.localStream?.getVideoTracks()[0] ?? null;

    if (this.localStream) {
      if (screenTrack) this.localStream.removeTrack(screenTrack);
      this.localStream.addTrack(this.cameraTrack);
    }

    if (this.localVideoEl) {
      this.localVideoEl.srcObject = this.localStream;
    }

    // Restore camera track on all peers
    for (const state of this.peerStates.values()) {
      const sender = state.pc.getSenders().find(s => s.track === screenTrack);
      if (sender) {
        await sender.replaceTrack(this.cameraTrack);
      }
    }

    if (screenTrack) {
      screenTrack.stop();
    }

    this.cameraTrack = null;
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  removePeer(socketId: string): void {
    const state = this.peerStates.get(socketId);
    if (state) {
      state.pc.close();
      this.peerStates.delete(socketId);
    }
    this.remoteStreamsMap.delete(socketId);
  }

  closeAll(): void {
    for (const state of this.peerStates.values()) {
      state.pc.close();
    }
    this.peerStates.clear();
    this.remoteStreamsMap.clear();
    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = null;
    this.localVideoEl = null;
    this.cameraTrack = null;
  }

  // Legacy getter for compatibility
  get peers(): Map<string, RTCPeerConnection> {
    const map = new Map<string, RTCPeerConnection>();
    for (const [id, state] of this.peerStates.entries()) {
      map.set(id, state.pc);
    }
    return map;
  }
}
