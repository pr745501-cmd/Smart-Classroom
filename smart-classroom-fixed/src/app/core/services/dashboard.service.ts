import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private API = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // Returns { subjects, pending, attendance } stats for the student dashboard
  getStats() {
    return this.http.get<any>(`${this.API}/dashboard/stats`).pipe(map(res => res.stats));
  }
}
