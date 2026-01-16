import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {

  private API = 'http://localhost:5000/api/assignment';

  constructor(private http: HttpClient) {}

  getAssignments() {
    return this.http.get<any>(this.API).pipe(
      map(response => {
        console.log('API RAW RESPONSE:', response);
        return response.assignments; // ✅ return ARRAY only
      })
    );
  }

  createAssignment(data: any) {
    return this.http.post(this.API, data);
  }
}
