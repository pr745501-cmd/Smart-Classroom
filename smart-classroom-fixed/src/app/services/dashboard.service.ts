import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private API = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get(`${this.API}/student/profile`);
  }

  getStats(): Observable<{ subjects: number; pending: number; attendance: number }> {
    return this.http.get<any>(`${this.API}/dashboard/stats`).pipe(
      map(res => res.stats)
    );
  }
}
