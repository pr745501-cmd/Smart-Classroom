import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-admin-users',
  standalone: true,
 imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.html',
  styleUrls:['./admin-users.css']
})
export class AdminUsers implements OnInit {

  users: any[] = [];
  filteredUsers: any[] = [];

  search = '';
  loading = true;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  /* ========================= */
  loadUsers() {
    this.http.get<any>(
      'http://localhost:5000/api/admin/users',
      {
        headers:{
          Authorization:`Bearer ${localStorage.getItem('token')}`
        }
      }
    ).subscribe(res => {
      this.users = res.users || [];
      this.filteredUsers = this.users;
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  /* ========================= */
  filterUsers() {
    this.filteredUsers = this.users.filter(u =>
      u.name.toLowerCase().includes(this.search.toLowerCase()) ||
      u.email.toLowerCase().includes(this.search.toLowerCase()) ||
      u.role.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  /* ========================= */
  deleteUser(id: string) {
    if (!confirm("Delete this user?")) return;

    this.http.delete(
      `http://localhost:5000/api/admin/users/${id}`,
      {
        headers:{
          Authorization:`Bearer ${localStorage.getItem('token')}`
        }
      }
    ).subscribe(() => {
      this.loadUsers();
    });
  }

  /* ========================= */
  getByRole(role: string) {
    return this.filteredUsers.filter(u => u.role === role);
  }
}
