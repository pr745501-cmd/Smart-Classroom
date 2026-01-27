import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {

  api = "http://localhost:5000/api/assignments";

  constructor(private http: HttpClient) {}

  /* CREATE */
  createAssignment(data: any) {
    return this.http.post(this.api, data);
  }

  /* FACULTY */
  getFacultyAssignments(name: string) {
    return this.http.get<any>(`${this.api}/faculty/${name}`);
  }

  /* STUDENT */
  getAssignments() {
    return this.http.get<any>(this.api);
  }

  /* UPDATE */
  updateAssignment(id: string, data: any) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  /* DELETE */
  deleteAssignment(id: string) {
    return this.http.delete(`${this.api}/${id}`);
  }

}
