import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  socket: Socket;

  constructor() {

    this.socket = io("http://localhost:5000", {
      transports: ['websocket']
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

}