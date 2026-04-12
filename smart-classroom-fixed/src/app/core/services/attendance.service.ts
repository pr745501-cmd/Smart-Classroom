import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private API = `${environment.apiUrl}/api/attendance`;

  constructor(private http: HttpClient) {}

  addAttendance(data: any) { return this.http.post(this.API, data); }
}
