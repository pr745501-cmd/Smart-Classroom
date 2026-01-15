import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-student-assignments',
  standalone: true,
  imports: [CommonModule, HttpClientModule], // ✅ VERY IMPORTANT
  templateUrl: './student-assignments.html',
  styleUrls: ['./student-assignments.css']
})
export class StudentAssignments implements OnInit {

  assignments: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http
      .get<any[]>('http://localhost:5000/api/assignments')
      .subscribe((res: any[]) => {
        this.assignments = res;
      });
  }
}
