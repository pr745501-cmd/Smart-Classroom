import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DmChatService, DirectMessage } from '../../../../core/services/dm-chat.service';
import { SocketService } from '../../../../core/services/socket.service';

@Component({
  selector: 'app-dm-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dm-chat.component.html',
  styleUrls: ['./dm-chat.component.css']
})
export class DmChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  messages: DirectMessage[] = [];
  messageText = '';
  contactId = '';
  contactName = '';
  contactInitials = '';
  contactIsOnline = false;
  contactLastSeen: string | null = null;
  roomId = '';
  currentUserId = '';
  currentUserName = '';
  showEmojiPicker = false;
  isTyping = false;
  typingName = '';
  isReconnecting = false;
  isUserScrolledUp = false;
  hasMoreMessages = false;

  readonly emojiCategories = [
    { label: '😀 Smileys', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'] },
    { label: '👋 Gestures', emojis: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👀','👁️','👅','👄'] },
    { label: '❤️ Hearts', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘'] },
    { label: '🎉 Celebration', emojis: ['🎉','🎊','🎈','🎁','🎀','🎗️','🎟️','🎫','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎪','🤹','🎭','🎨','🎬','🎤','🎧','🎼','🎵','🎶','🎷','🎸','🎹','🎺','🎻','🥁','🪘','🎮','🕹️','🎲','♟️','🎯','🎳','🎰','🧩'] },
    { label: '🌍 Nature', emojis: ['🌍','🌎','🌏','🌐','🗺️','🧭','🌋','⛰️','🏔️','🗻','🏕️','🏖️','🏜️','🏝️','🏞️','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙️','🌃','🌌','🌉','🌁','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄','🌬️','💨','🌪️','🌫️','🌈','☔','⚡','🌊','💧','🔥','🌿','🍀','🌱','🌲','🌳','🌴','🌵','🎋','🎍','🍃','🍂','🍁','🌾','🌺','🌸','🌼','🌻','🌹','🥀','🌷','🌙','⭐','🌟','💫','✨','☀️','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙'] },
    { label: '🍕 Food', emojis: ['🍕','🍔','🍟','🌭','🍿','🧂','🥓','🥚','🍳','🧇','🥞','🧈','🍞','🥐','🥖','🫓','🥨','🥯','🧀','🥗','🥙','🥪','🌮','🌯','🫔','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🫖','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾'] },
    { label: '🚗 Travel', emojis: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🛹','🛼','🚏','🛣️','🛤️','⛽','🚨','🚥','🚦','🛑','🚧','⚓','🛟','⛵','🚤','🛥️','🛳️','⛴️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰️','🚀','🛸','🪐'] },
  ];

  activeEmojiCategory = 0;

  private typingTimeout: any;
  private stopTypingTimeout: any;
  private typingDebounceTimeout: any;
  private lastTypingEmit = 0;

  /** Stable refs so we only remove our own socket listeners (shared socket app-wide). */
  private readonly handleReceiveDM = (msg: DirectMessage) => {
    this.ngZone.run(() => {
      const msgRoom = [msg.sender, msg.recipient].sort().join('_');
      if (msgRoom !== this.roomId) return;
      const enriched = { ...msg, readReceipt: msg.sender === this.currentUserId ? ('sent' as const) : undefined };
      this.messages.push(enriched);
      this.cd.detectChanges();
      if (!this.isUserScrolledUp) this.scrollToBottom();
      if (msg.sender !== this.currentUserId) {
        this.socketService.markRead(this.roomId, this.contactId);
      }
    });
  };

  private readonly handleDelivered = (data: { msgId: string }) => {
    this.ngZone.run(() => {
      const msg = this.messages.find(m => m._id === data.msgId);
      if (msg && msg.readReceipt === 'sent') msg.readReceipt = 'delivered';
      this.cd.detectChanges();
    });
  };

  private readonly handleMessagesRead = (data: { contactId: string }) => {
    this.ngZone.run(() => {
      if (data.contactId !== this.contactId) return;
      this.messages.forEach(m => {
        if (m.sender === this.currentUserId) m.readReceipt = 'read';
      });
      this.cd.detectChanges();
    });
  };

  private readonly handleTyping = (data: { userId: string }) => {
    this.ngZone.run(() => {
      // Only show typing indicator for the other person (not ourselves)
      if (data.userId !== this.currentUserId && data.userId === this.contactId) {
        this.isTyping = true;
        this.typingName = this.contactName || 'Contact';
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
          this.isTyping = false;
          this.cd.detectChanges();
        }, 4000);
        this.cd.detectChanges();
      }
    });
  };

  private readonly handleStopTyping = (data: { userId: string }) => {
    this.ngZone.run(() => {
      if (data.userId !== this.currentUserId && data.userId === this.contactId) {
        this.isTyping = false;
        clearTimeout(this.typingTimeout);
        this.cd.detectChanges();
      }
    });
  };

  private readonly handleUserOnlineDm = (data: { userId: string }) => {
    this.ngZone.run(() => {
      if (data.userId === this.contactId) {
        this.contactIsOnline = true;
        this.contactLastSeen = null;
        this.cd.detectChanges();
      }
    });
  };

  private readonly handleUserOfflineDm = (data: { userId: string; lastSeen: string }) => {
    this.ngZone.run(() => {
      if (data.userId === this.contactId) {
        this.contactIsOnline = false;
        this.contactLastSeen = data.lastSeen;
        this.cd.detectChanges();
      }
    });
  };

  private readonly handleDmConnectError = () => {
    this.ngZone.run(() => {
      this.isReconnecting = true;
      this.cd.detectChanges();
    });
  };

  private readonly handleDmConnect = () => {
    this.ngZone.run(() => {
      this.isReconnecting = false;
      if (this.roomId) {
        this.socketService.joinDM(this.roomId);
      }
      this.cd.detectChanges();
    });
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dmChatService: DmChatService,
    private socketService: SocketService,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = user._id || user.id || '';
    this.currentUserName = user.name || '';

    this.route.params.subscribe(params => {
      const prevRoom = this.roomId;
      this.tearDownDmSocketListeners();
      if (prevRoom) {
        this.socketService.leaveDM(prevRoom);
      }

      this.contactId = params['contactId'] || '';
      if (!this.contactId) {
        this.roomId = '';
        return;
      }
      this.roomId = [this.currentUserId, this.contactId].sort().join('_');
      this.loadContact();
      this.loadMessages();
      this.registerDmSocketListeners();
    });
  }

  private loadContact(): void {
    const role = JSON.parse(localStorage.getItem('user') || '{}').role;
    const fetchList = role === 'student'
      ? this.dmChatService.getFacultyList()
      : this.dmChatService.getStudentContacts();

    fetchList.subscribe(list => {
      const contact = list.find(c => c._id === this.contactId);
      if (contact) {
        this.contactName = contact.name;
        this.contactInitials = this.getInitials(contact.name);
        this.contactIsOnline = contact.isOnline;
        this.contactLastSeen = contact.lastSeen ?? null;
        if (this.isTyping) this.typingName = this.contactName;
        this.cd.detectChanges();
      } else {
        // fallback: fetch all users to find the contact by ID
        this.dmChatService.getUserById(this.contactId).subscribe(user => {
          if (user) {
            this.contactName = user.name;
            this.contactInitials = this.getInitials(user.name);
            if (this.isTyping) this.typingName = this.contactName;
            this.cd.detectChanges();
          }
        });
      }
    });
  }

  private loadMessages(): void {
    this.dmChatService.getConversation(this.contactId).subscribe(msgs => {
      this.messages = msgs.map(m => ({ ...m, readReceipt: m.sender === this.currentUserId ? 'sent' : undefined }));
      this.hasMoreMessages = msgs.length >= 100;
      this.cd.detectChanges();
      this.scrollToBottom();
      this.socketService.markRead(this.roomId, this.contactId);
    });
  }

  private tearDownDmSocketListeners(): void {
    const s = this.socketService.socket;
    s.off('receiveDM', this.handleReceiveDM);
    s.off('delivered', this.handleDelivered);
    s.off('messagesRead', this.handleMessagesRead);
    s.off('typing', this.handleTyping);
    s.off('stopTyping', this.handleStopTyping);
    s.off('userOnline', this.handleUserOnlineDm);
    s.off('userOffline', this.handleUserOfflineDm);
    s.off('connect_error', this.handleDmConnectError);
    s.off('connect', this.handleDmConnect);
  }

  private registerDmSocketListeners(): void {
    const s = this.socketService.socket;
    s.on('receiveDM', this.handleReceiveDM);
    s.on('delivered', this.handleDelivered);
    s.on('messagesRead', this.handleMessagesRead);
    s.on('typing', this.handleTyping);
    s.on('stopTyping', this.handleStopTyping);
    s.on('userOnline', this.handleUserOnlineDm);
    s.on('userOffline', this.handleUserOfflineDm);
    s.on('connect_error', this.handleDmConnectError);
    s.on('connect', this.handleDmConnect);
    this.socketService.joinDM(this.roomId);
  }

  sendMessage(): void {
    if (!this.messageText.trim()) return;
    const text = this.messageText.trim();
    this.messageText = '';
    this.socketService.sendDM({
      roomId: this.roomId,
      recipientId: this.contactId,
      text,
      senderId: this.currentUserId
    });
    clearTimeout(this.typingDebounceTimeout);
    clearTimeout(this.stopTypingTimeout);
    this.socketService.emitStopTyping(this.roomId);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onInputChange(): void {
    const now = Date.now();
    if (now - this.lastTypingEmit > 2000) {
      this.socketService.emitTyping(this.roomId);
      this.lastTypingEmit = now;
    }
    clearTimeout(this.stopTypingTimeout);
    this.stopTypingTimeout = setTimeout(() => {
      this.socketService.emitStopTyping(this.roomId);
    }, 3000);
  }

  onScroll(): void {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return;
    this.isUserScrolledUp = el.scrollTop < el.scrollHeight - el.clientHeight - 50;
  }

  loadEarlierMessages(): void {
    if (!this.messages.length) return;
    const before = this.messages[0].timestamp;
    this.dmChatService.getConversation(this.contactId, before).subscribe(older => {
      this.messages = [...older.map(m => ({ ...m, readReceipt: m.sender === this.currentUserId ? ('sent' as const) : undefined })), ...this.messages];
      this.hasMoreMessages = older.length >= 100;
      this.cd.detectChanges();
    });
  }

  toggleEmojiPicker(event: MouseEvent): void {
    event.stopPropagation();
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  insertEmoji(emoji: string): void {
    const input = this.messageInput?.nativeElement as HTMLTextAreaElement;
    if (input) {
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      this.messageText = input.value.slice(0, start) + emoji + input.value.slice(end);
      setTimeout(() => {
        input.selectionStart = input.selectionEnd = start + emoji.length;
        input.focus();
      });
    } else {
      this.messageText += emoji;
    }
    this.showEmojiPicker = false;
  }

  closeEmojiPicker(): void {
    this.showEmojiPicker = false;
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 10);
  }

  getInitials(name: string): string {
    const words = name.trim().split(/\s+/);
    const first = words[0]?.[0] ?? '';
    const last = words.length > 1 ? words[words.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  formatTime(timestamp: string): string {
    const d = new Date(timestamp);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  formatLastSeen(lastSeen: string | null): string {
    if (!lastSeen) return '';
    const date = new Date(lastSeen);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = this.formatTime(lastSeen);
    if (isToday) return `Last seen today at ${timeStr}`;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return `Last seen yesterday at ${timeStr}`;
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `Last seen ${month} ${date.getDate()} at ${timeStr}`;
  }

  getDateLabel(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === now.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  showDateSeparator(index: number): boolean {
    if (index === 0) return true;
    const prev = new Date(this.messages[index - 1].timestamp).toDateString();
    const curr = new Date(this.messages[index].timestamp).toDateString();
    return prev !== curr;
  }

  trackMessage(_index: number, msg: DirectMessage): string {
    return msg._id;
  }

  goBack(): void {
    this.router.navigate(['/dm']);
  }

  ngOnDestroy(): void {
    clearTimeout(this.typingTimeout);
    clearTimeout(this.stopTypingTimeout);
    clearTimeout(this.typingDebounceTimeout);
    if (this.roomId) {
      this.socketService.leaveDM(this.roomId);
    }
    this.tearDownDmSocketListeners();
  }
}
