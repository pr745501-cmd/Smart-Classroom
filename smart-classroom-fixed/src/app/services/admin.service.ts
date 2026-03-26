import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getStats(): Observable<any> {
    return this.http.get('http://localhost:5000/api/admin/stats', { headers: this.getHeaders() });
  }

  getUsers(): Observable<any> {
    return this.http.get('http://localhost:5000/api/admin/users', { headers: this.getHeaders() });
  }

  approveUser(id: string): Observable<any> {
    return this.http.put(`http://localhost:5000/api/admin/approve/${id}`, { isApproved: true }, { headers: this.getHeaders() });
  }

  rejectUser(id: string): Observable<any> {
    return this.http.delete(`http://localhost:5000/api/admin/users/${id}`, { headers: this.getHeaders() });
  }

  getAnnouncements(): Observable<any> {
    return this.http.get('http://localhost:5000/api/announcements', { headers: this.getHeaders() });
  }

  deleteAnnouncement(id: string): Observable<any> {
    return this.http.delete(`http://localhost:5000/api/announcements/${id}`, { headers: this.getHeaders() });
  }

  getAssignments(): Observable<any> {
    return this.http.get('http://localhost:5000/api/assignments', { headers: this.getHeaders() });
  }

  getAllAttendance(): Observable<any> {
    return this.http.get('http://localhost:5000/api/attendance/all', { headers: this.getHeaders() });
  }
}
