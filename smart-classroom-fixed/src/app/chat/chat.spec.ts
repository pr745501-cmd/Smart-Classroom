import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chat } from './chat';
import { SocketService } from '../services/socket.service';

describe('Chat', () => {
  let component: Chat;
  let fixture: ComponentFixture<Chat>;

  beforeEach(async () => {
    const socketStub = {
      connected: true,
      on: jasmine.createSpy('on'),
      off: jasmine.createSpy('off')
    };

    await TestBed.configureTestingModule({
      imports: [Chat],
      providers: [
        {
          provide: SocketService,
          useValue: {
            socket: socketStub,
            joinRoom: jasmine.createSpy('joinRoom'),
            sendMessage: jasmine.createSpy('sendMessage')
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Chat);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
