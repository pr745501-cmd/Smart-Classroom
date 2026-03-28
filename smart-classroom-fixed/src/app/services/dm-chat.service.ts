import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface DirectMessage {
  _id: string;
  sender: string;
  recipient: string;
  text: string;
  readStatus: boolean;
  timestamp: string;
  readReceipt?: 'sent' | 'delivered' | 'read';
}

export interface FacultyContact {
  _id: string;
  name: string;
  isOnline: boolean;
  lastSeen: string | null;
  lastMessage?: { text: string; timestamp: string };
  unreadCount: number;
}

export interface StudentContact {
  _id: string;
  name: string;
  isOnline: boolean;
  lastSeen: string | null;
  lastMessage?: { text: string; timestamp: string };
  unreadCount: number;
}

/** Server → client: refresh inbox row for /dm list without full page reload */
export interface DmInboxUpdatePayload {
  peerId: string;
  lastMessage?: { text: string; timestamp: string | Date };
  incrementUnread?: boolean;
  resetUnread?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DmChatService {
  private apiUrl = 'http://localhost:5000/api/chat';

  constructor(private http: HttpClient, private router: Router) {}

  private getHeaders() {
    return { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } };
  }

  getFacultyList(): Observable<FacultyContact[]> {
    return this.http.get<FacultyContact[]>(`${this.apiUrl}/faculty`, this.getHeaders()).pipe(
      catchError((err) => {
        if (err.status === 401) {
          this.router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }

  getStudentContacts(): Observable<StudentContact[]> {
    return this.http.get<StudentContact[]>(`${this.apiUrl}/contacts`, this.getHeaders()).pipe(
      catchError((err) => {
        if (err.status === 401) {
          this.router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }

  getConversation(contactId: string, before?: string): Observable<DirectMessage[]> {
    const url = before
      ? `${this.apiUrl}/conversation/${contactId}?before=${before}`
      : `${this.apiUrl}/conversation/${contactId}`;
    return this.http.get<DirectMessage[]>(url, this.getHeaders()).pipe(
      catchError((err) => {
        if (err.status === 401) {
          this.router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }

  getUserById(userId: string): Observable<{ name: string; isOnline: boolean; lastSeen: string | null } | null> {
    return this.http.get<any>(`http://localhost:5000/api/auth/user/${userId}`, this.getHeaders()).pipe(
      catchError(() => throwError(() => null))
    );
  }
}
