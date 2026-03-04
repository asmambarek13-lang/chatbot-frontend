import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  errorMsg = '';
  loading = false;
  showPassword = false;
  selectedLang: 'fr' | 'ar' = 'fr';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    if (!this.username || !this.password) {
      this.errorMsg = 'Veuillez remplir tous les champs';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.auth.login({
      username: this.username,
      password: this.password
    }).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: () => {
        this.errorMsg = 'Identifiants incorrects. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  setLang(lang: 'fr' | 'ar') {
    this.selectedLang = lang;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}