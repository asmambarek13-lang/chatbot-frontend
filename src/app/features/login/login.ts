import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  selectedLang: 'fr' | 'ar' = 'fr';
  username = '';
  password = '';
  showPass = false;
  userFocused = false;
  passFocused = false;
  loading = false;
  error = '';

  features = [
    { icon: '🤖', fr: 'Assistant IA bilingue FR/AR', ar: 'مساعد ذكي ثنائي اللغة' },
    { icon: '📄', fr: 'Génération PDF & Word', ar: 'توليد وثائق PDF و Word' },
    { icon: '🔍', fr: 'Base de connaissances RAG', ar: 'قاعدة معرفة RAG' },
    { icon: '🔒', fr: 'Sécurité avancée JWT', ar: 'أمان JWT متقدم' }
  ];

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (!this.username || !this.password) {
      this.error = this.selectedLang === 'ar'
        ? 'يرجى ملء جميع الحقول'
        : 'Veuillez remplir tous les champs';
      return;
    }
    this.loading = true;
    this.error = '';
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate([res.role === 'ADMIN' ? '/admin' : '/chat']);
      },
      error: () => {
        this.loading = false;
        this.error = this.selectedLang === 'ar'
          ? 'اسم المستخدم أو كلمة المرور غير صحيحة'
          : 'Nom d\'utilisateur ou mot de passe incorrect';
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}