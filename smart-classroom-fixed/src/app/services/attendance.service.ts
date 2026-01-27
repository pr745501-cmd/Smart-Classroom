import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AttendanceService {

  private API = 'http://localhost:5000/api/attendance';

  constructor(private http: HttpClient) {}

  addAttendance(data: any) {
    return this.http.post(this.API, data);
  }
}
