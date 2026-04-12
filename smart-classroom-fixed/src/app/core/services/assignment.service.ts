import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private API = `${environment.apiUrl}/api/assignments`;

  constructor(private http: HttpClient) {}

  createAssignment(data: any)              { return this.http.post(this.API, data); }
  getAssignments()                         { return this.http.get<any>(this.API); }
  getFacultyAssignments(name: string)      { return this.http.get<any>(`${this.API}/faculty/${name}`); }
  updateAssignment(id: string, data: any)  { return this.http.put(`${this.API}/${id}`, data); }
  deleteAssignment(id: string)             { return this.http.delete(`${this.API}/${id}`); }
}
