import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DmChatService, DirectMessage } from '../../services/dm-chat.service';
import { SocketService } from '../../services/socket.service';

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
  private typingDebounceTimeout: any;
  private lastTypingEmit = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dmChatService: DmChatService,
    private socketService: SocketService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = user._id || user.id || '';
    this.currentUserName = user.name || '';

    this.route.params.subscribe(params => {
      this.contactId = params['contactId'];
      this.roomId = [this.currentUserId, this.contactId].sort().join('_');
      this.loadContact();
      this.loadMessages();
      this.setupSocket();
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

  private setupSocket(): void {
    this.socketService.joinDM(this.roomId);

    this.socketService.onReceiveDM((msg: DirectMessage) => {
      const enriched = { ...msg, readReceipt: msg.sender === this.currentUserId ? ('sent' as const) : undefined };
      this.messages.push(enriched);
      this.cd.detectChanges();
      if (!this.isUserScrolledUp) this.scrollToBottom();
      if (msg.sender !== this.currentUserId) {
        this.socketService.markRead(this.roomId, this.contactId);
      }
    });

    this.socketService.onDelivered((data: { msgId: string }) => {
      const msg = this.messages.find(m => m._id === data.msgId);
      if (msg && msg.readReceipt === 'sent') msg.readReceipt = 'delivered';
      this.cd.detectChanges();
    });

    this.socketService.onMessagesRead(() => {
      this.messages.forEach(m => {
        if (m.sender === this.currentUserId) m.readReceipt = 'read';
      });
      this.cd.detectChanges();
    });

    this.socketService.onTyping((data: { userId: string }) => {
      if (data.userId === this.contactId) {
        this.isTyping = true;
        // contactName may not be loaded yet — use it if available, else show generic
        this.typingName = this.contactName || 'Contact';
        this.cd.detectChanges();
      }
    });

    this.socketService.onStopTyping((data: { userId: string }) => {
      if (data.userId === this.contactId) {
        this.isTyping = false;
        this.cd.detectChanges();
      }
    });

    this.socketService.onUserOnline((data: { userId: string }) => {
      if (data.userId === this.contactId) {
        this.contactIsOnline = true;
        this.contactLastSeen = null;
        this.cd.detectChanges();
      }
    });

    this.socketService.onUserOffline((data: { userId: string; lastSeen: string }) => {
      if (data.userId === this.contactId) {
        this.contactIsOnline = false;
        this.contactLastSeen = data.lastSeen;
        this.cd.detectChanges();
      }
    });

    this.socketService.onConnectError(() => {
      this.isReconnecting = true;
      this.cd.detectChanges();
    });

    this.socketService.socket.on('connect', () => {
      this.isReconnecting = false;
      this.cd.detectChanges();
    });
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
    clearTimeout(this.typingTimeout);
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
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
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
    clearTimeout(this.typingDebounceTimeout);
    this.socketService.offEvent('receiveDM');
    this.socketService.offEvent('delivered');
    this.socketService.offEvent('messagesRead');
    this.socketService.offEvent('typing');
    this.socketService.offEvent('stopTyping');
    this.socketService.offEvent('userOnline');
    this.socketService.offEvent('userOffline');
    this.socketService.offEvent('connect_error');
    this.socketService.offEvent('connect');
  }
}
