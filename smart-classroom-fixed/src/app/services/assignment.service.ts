import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {

  private API = 'http://localhost:5000/api/assignments';

  constructor(private http: HttpClient) {}

  // CREATE
  createAssignment(data: any) {
    return this.http.post<any>(this.API, data);
  }

  // GET ALL (STUDENT)
  getAssignments() {
    return this.http.get<any>(this.API);
  }

  // GET FACULTY
  getFacultyAssignments(name: string) {
    return this.http.get<any>(`${this.API}/faculty/${name}`);
  }
}
