import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {

  private API = 'http://localhost:5000/api/announcement';

  constructor(private http: HttpClient) {}

  createAnnouncement(data: any) {
    return this.http.post(this.API, data);
  }

  getAnnouncements() {
    return this.http.get<any>(this.API).pipe(
      map(res => res.announcements)
    );
  }
}
