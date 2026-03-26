import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lectures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lecture.html',
  styleUrls: ['./lecture.css']
})
export class Lectures implements OnInit {

  lectures: any[] = [];
  filteredLectures: any[] = [];
  subjects: string[] = [];

  searchText: string = '';
  selectedSubject: string = '';
  loading: boolean = true;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadLectures();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  loadLectures() {
    this.http.get<any>('http://localhost:5000/api/lectures').subscribe({
      next: (res) => {
        this.lectures = res.lectures ?? [];
        this.filteredLectures = [...this.lectures];
        this.subjects = [...new Set(this.lectures.map((l: any) => l.subject))];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter() {
    this.filteredLectures = this.lectures.filter(l => {
      const titleMatch = l.title.toLowerCase().includes(this.searchText.toLowerCase());
      const subjectMatch = !this.selectedSubject || l.subject === this.selectedSubject;
      return titleMatch && subjectMatch;
    });
    this.cdr.detectChanges();
  }
}
