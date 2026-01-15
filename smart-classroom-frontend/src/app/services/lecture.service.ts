import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LectureService {

  private API_URL = 'http://localhost:5000/api/lecture';

  private lecturesSubject = new BehaviorSubject<any[]>([]);
  lectures$ = this.lecturesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // 🔥 API CALL HERE
  fetchLectures() {
    this.http.get<any>(this.API_URL).subscribe({
      next: (res) => {
        this.lecturesSubject.next(res.lectures || []);
      },
      error: () => {
        this.lecturesSubject.next([]);
      }
    });
  }
}
