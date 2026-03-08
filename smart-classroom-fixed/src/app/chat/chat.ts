import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class Chat implements OnInit {

  socket!: Socket;

  message = "";

  lectureId = "classroom";

  messages:any[] = [];

  user:any;

  @ViewChild('scrollContainer') scroll!:ElementRef;

  constructor(private cd:ChangeDetectorRef){}

  ngOnInit(){

    this.user = JSON.parse(localStorage.getItem("user") || "{}");

    this.socket = io("http://localhost:5000");

    this.socket.on("connect",()=>{

      console.log("Socket connected:",this.socket.id);

      this.socket.emit("joinLecture",this.lectureId);

    });

    /* LOAD CHAT HISTORY */

    this.socket.on("chatHistory",(history:any)=>{

      this.messages = history;

      this.cd.detectChanges();

      this.scrollDown();

    });

    /* RECEIVE MESSAGE */

    this.socket.on("receiveMessage",(data:any)=>{

      this.messages.push(data);

      // force UI refresh
      this.cd.detectChanges();

      this.scrollDown();

    });

  }

  sendMessage(){

    if(!this.message.trim()) return;

    const data = {

      lectureId:this.lectureId,

      senderName:this.user.name,

      senderRole:this.user.role,

      message:this.message

    };

    this.socket.emit("sendMessage",data);

    this.message="";

  }

  /* AUTO SCROLL */

  scrollDown(){

    setTimeout(()=>{

      if(this.scroll){

        this.scroll.nativeElement.scrollTop =
        this.scroll.nativeElement.scrollHeight;

      }

    },10);

  }

  /* TRACK BY (performance boost) */

  trackMsg(index:number,item:any){

    return item._id || index;

  }

}