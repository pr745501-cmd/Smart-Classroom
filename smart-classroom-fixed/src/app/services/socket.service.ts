import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  socket: Socket;

  constructor() {

    this.socket = io("http://localhost:5000", {
      transports: ['websocket'],
      auth: { token: localStorage.getItem('token') }
    });

  }

  joinRoom(roomId: string) {
    this.socket.emit("joinLecture", roomId);
  }

  sendMessage(data: any) {
    this.socket.emit("sendMessage", data);
  }

  onMessage(callback: any) {
    this.socket.on("receiveMessage", callback);
  }

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

}