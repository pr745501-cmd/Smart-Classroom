import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LectureService {

  private api = 'http://localhost:5000/api/lectures'; // ✅ FIXED

  constructor(private http: HttpClient) {}

  getLectures() {
    return this.http.get<any>(this.api).pipe(
      map(res => res.lectures || []) // ✅ ALWAYS ARRAY
    );
  }
}
