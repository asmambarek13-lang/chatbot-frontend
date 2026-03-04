import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss']
})
export class AdminComponent implements OnInit {
  users: any[] = [];
  totalUsers = 0;
  loading = true;

  stats = [
    { label: 'Utilisateurs', value: 0, icon: '👥' },
    { label: 'Conversations', value: 0, icon: '💬' },
    { label: 'Documents générés', value: 0, icon: '📄' },
    { label: 'Requêtes today', value: 0, icon: '📊' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadUsers();
  }

  loadUsers() {
    fetch('/api/admin/users', {
      headers: {
        'Authorization': 'Bearer ' + this.authService.getToken(),
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(users => {
      this.users = users;
      this.totalUsers = users.length;
      this.stats[0].value = users.length;
      this.loading = false;
      this.cdr.detectChanges();
    })
    .catch(err => {
      console.log('Erreur:', err);
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  goToChat() {
    this.router.navigate(['/chat']);
  }

  logout() {
    this.authService.logout();
  }
}