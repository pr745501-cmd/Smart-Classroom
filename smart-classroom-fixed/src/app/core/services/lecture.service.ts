import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LectureService {
  private API = `${environment.apiUrl}/api/lectures`;

  constructor(private http: HttpClient) {}

  // Always returns an array (never undefined)
  getLectures() {
    return this.http.get<any>(this.API).pipe(map(res => res.lectures || []));
  }
}
