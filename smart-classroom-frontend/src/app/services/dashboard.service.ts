import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private API = 'http://localhost:5000/api/student';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get(`${this.API}/profile`);
  }

  getLectures(): Observable<any> {
    return this.http.get(`${this.API}/lectures`);
  }
}
