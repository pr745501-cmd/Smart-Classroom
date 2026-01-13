import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LectureService {

  private API_URL = 'http://localhost:8080/api/lectures';

  constructor(private http: HttpClient) {}

  getAllLectures(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }
}
