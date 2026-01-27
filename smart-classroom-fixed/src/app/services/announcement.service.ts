import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {

  private API = 'http://localhost:5000/api/announcements';

  constructor(private http: HttpClient) {}

  // CREATE
  createAnnouncement(data: any) {
    return this.http.post<any>(this.API, data);
  }

  // STUDENT
  getAnnouncements() {
    return this.http.get<any>(this.API);
  }

  // FACULTY
  getFacultyAnnouncements(name: string) {
    return this.http.get<any>(`${this.API}/faculty/${name}`);
  }
}
