import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LectureService {
  private API = 'http://localhost:5000/api/lectures';

  constructor(private http: HttpClient) {}

  // Always returns an array (never undefined)
  getLectures() {
    return this.http.get<any>(this.API).pipe(map(res => res.lectures || []));
  }
}
