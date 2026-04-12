import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LiveClassService {
  private API = `${environment.apiUrl}/api/live-class`;

  constructor(private http: HttpClient) {}

  startClass(data: any)          { return this.http.post(this.API + '/start', data); }
  getLiveClass()                 { return this.http.get(this.API); }
  endClass()                     { return this.http.delete(this.API + '/end'); }
  joinClass(meetingCode: string) { return this.http.post(this.API + '/join', { meetingCode }); }
  forceEndClass()                { return this.http.delete(this.API + '/force-end'); }
}
