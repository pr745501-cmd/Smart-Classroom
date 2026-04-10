import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class LiveClassService {
  private API = 'http://localhost:5000/api/live-class';

  constructor(private http: HttpClient) {}

  startClass(data: any)          { return this.http.post(this.API + '/start', data); }
  getLiveClass()                 { return this.http.get(this.API); }
  endClass()                     { return this.http.delete(this.API + '/end'); }
  joinClass(meetingCode: string) { return this.http.post(this.API + '/join', { meetingCode }); }
  forceEndClass()                { return this.http.delete(this.API + '/force-end'); }
}
