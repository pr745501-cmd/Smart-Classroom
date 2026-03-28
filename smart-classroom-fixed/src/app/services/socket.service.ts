import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  socket: Socket;

  constructor() {
    this.socket = io('http://localhost:5000', {
      transports: ['websocket'],
      auth: { token: localStorage.getItem('token') }
    });
  }

  // ── Chat / Lecture ──────────────────────────────────────────────────────────

  joinRoom(roomId: string) {
    this.socket.emit('joinLecture', roomId);
  }

  sendMessage(data: any) {
    this.socket.emit('sendMessage', data);
  }

  onMessage(callback: any) {
    this.socket.on('receiveMessage', callback);
  }

  // ── Direct Messages ─────────────────────────────────────────────────────────

  joinDM(roomId: string): void {
    this.socket.emit('joinDM', { roomId });
  }

  sendDM(payload: { roomId: string; recipientId: string; text: string; senderId: string }): void {
    this.socket.emit('sendDM', payload);
  }

  onReceiveDM(cb: (msg: any) => void): void {
    this.socket.on('receiveDM', cb);
  }

  onUserOnline(cb: (data: { userId: string }) => void): void {
    this.socket.on('userOnline', cb);
  }

  onUserOffline(cb: (data: { userId: string; lastSeen: string }) => void): void {
    this.socket.on('userOffline', cb);
  }

  markRead(roomId: string, contactId: string): void {
    this.socket.emit('markRead', { roomId, contactId });
  }

  onDelivered(cb: (data: { msgId: string }) => void): void {
    this.socket.on('delivered', cb);
  }

  onMessagesRead(cb: (data: { contactId: string }) => void): void {
    this.socket.on('messagesRead', cb);
  }

  emitTyping(roomId: string): void {
    this.socket.emit('typing', { roomId });
  }

  emitStopTyping(roomId: string): void {
    this.socket.emit('stopTyping', { roomId });
  }

  onTyping(cb: (data: { userId: string }) => void): void {
    this.socket.on('typing', cb);
  }

  onStopTyping(cb: (data: { userId: string }) => void): void {
    this.socket.on('stopTyping', cb);
  }

  onConnectError(cb: (err: Error) => void): void {
    this.socket.on('connect_error', cb);
  }

  offEvent(event: string): void {
    this.socket.off(event);
  }

  // ── Announcements Real-Time ─────────────────────────────────────────────────

  joinAnnouncements(): void {
    this.socket.emit('joinAnnouncements');
  }

  onAnnouncementCreated(cb: (data: any) => void): void {
    this.socket.on('announcementCreated', cb);
  }

  onAnnouncementUpdated(cb: (data: any) => void): void {
    this.socket.on('announcementUpdated', cb);
  }

  onAnnouncementDeleted(cb: (data: { _id: string }) => void): void {
    this.socket.on('announcementDeleted', cb);
  }

  joinMeetingRoom(sessionId: string): void {
    this.socket.emit('joinMeetingRoom', { sessionId });
  }

  leaveMeetingRoom(sessionId: string): void {
    this.socket.emit('leaveMeetingRoom', { sessionId });
  }

  onMeetingStarted(cb: (data: any) => void): void {
    this.socket.on('meetingStarted', cb);
  }

  onMeetingEnded(cb: (data: any) => void): void {
    this.socket.on('meetingEnded', cb);
  }

  onParticipantJoined(cb: (data: any) => void): void {
    this.socket.on('participantJoined', cb);
  }

  onExistingParticipants(cb: (data: any[]) => void): void {
    this.socket.on('existingParticipants', cb);
  }

  onParticipantLeft(cb: (data: any) => void): void {
    this.socket.on('participantLeft', cb);
  }

  onOffer(cb: (data: any) => void): void {
    this.socket.on('offer', cb);
  }

  onAnswer(cb: (data: any) => void): void {
    this.socket.on('answer', cb);
  }

  onIceCandidate(cb: (data: any) => void): void {
    this.socket.on('iceCandidate', cb);
  }

  sendOffer(payload: any): void {
    this.socket.emit('offer', payload);
  }

  sendAnswer(payload: any): void {
    this.socket.emit('answer', payload);
  }

  sendIceCandidate(payload: any): void {
    this.socket.emit('iceCandidate', payload);
  }
}
