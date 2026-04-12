import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Note: token is automatically added by the auth interceptor (auth-interceptor.ts)
@Injectable({ providedIn: 'root' })
export class AdminService {
  private API = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getStats()                    { return this.http.get(`${this.API}/admin/stats`); }
  getUsers()                    { return this.http.get(`${this.API}/admin/users`); }
  approveUser(id: string)       { return this.http.put(`${this.API}/admin/approve/${id}`, { isApproved: true }); }
  rejectUser(id: string)        { return this.http.delete(`${this.API}/admin/users/${id}`); }
  getAnnouncements()            { return this.http.get(`${this.API}/announcements`); }
  deleteAnnouncement(id: string){ return this.http.delete(`${this.API}/announcements/${id}`); }
  getAssignments()              { return this.http.get(`${this.API}/assignments`); }
  getAllAttendance()             { return this.http.get(`${this.API}/attendance/all`); }
}
