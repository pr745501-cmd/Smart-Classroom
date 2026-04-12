import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private API = `${environment.apiUrl}/api/announcements`;

  constructor(private http: HttpClient) {}

  createAnnouncement(data: any)          { return this.http.post<any>(this.API, data); }
  getAnnouncements()                     { return this.http.get<any>(this.API); }
  getFacultyAnnouncements(name: string)  { return this.http.get<any>(`${this.API}/faculty/${name}`); }
  updateAnnouncement(id: string, data: any) { return this.http.put(`${this.API}/${id}`, data); }
  deleteAnnouncement(id: string)         { return this.http.delete(`${this.API}/${id}`); }
}
