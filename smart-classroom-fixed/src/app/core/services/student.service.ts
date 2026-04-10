import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private API = 'http://localhost:5000/api/student';

  constructor(private http: HttpClient) {}

  getProfile() { return this.http.get<any>(`${this.API}/profile`); }
}
