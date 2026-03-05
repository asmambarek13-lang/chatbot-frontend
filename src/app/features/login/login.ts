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
  userFocused = false;
  passFocused = false;

  featuresFr = [
    { icon: '🧠', text: 'NLP bilingue Arabe & Français' },
    { icon: '📄', text: 'Génération PDF & Word automatique' },
    { icon: '🔍', text: 'Base de connaissances RAG' },
    { icon: '⚡', text: 'Réponses en temps réel' },
  ];

  featuresAr = [
    { icon: '🧠', text: 'معالجة اللغة الطبيعية عربي وفرنسي' },
    { icon: '📄', text: 'توليد PDF و Word تلقائياً' },
    { icon: '🔍', text: 'قاعدة معرفة RAG متكاملة' },
    { icon: '⚡', text: 'ردود فورية في الوقت الحقيقي' },
  ];

  particles = Array.from({ length: 20 }, () => {
    const size = Math.random() * 6 + 2;
    return `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${size}px;height:${size}px;animation-delay:${Math.random()*5}s;animation-duration:${Math.random()*10+8}s;opacity:${Math.random()*0.4+0.1}`;
  });

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    if (!this.username || !this.password) {
      this.errorMsg = this.selectedLang === 'ar'
        ? 'يرجى ملء جميع الحقول'
        : 'Veuillez remplir tous les champs';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        if (this.auth.isAdmin()) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/chat']);
        }
      },
      error: (err) => {
        this.errorMsg = err.status === 401
          ? (this.selectedLang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Identifiants incorrects.')
          : (this.selectedLang === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Erreur de connexion au serveur.');
        this.loading = false;
      }
    });
  }

  setLang(lang: 'fr' | 'ar') { this.selectedLang = lang; }
  togglePassword() { this.showPassword = !this.showPassword; }
}