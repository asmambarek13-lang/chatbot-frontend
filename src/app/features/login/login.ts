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

  roleSelected = false;
  selectedRole = '';
  showRegister = false;

  regForm: any = {
    nom: '', prenom: '', email: '',
    specialite: '', username: '', password: ''
  };

  features = [
    { icon: '🤖', fr: 'Assistant IA bilingue FR/AR', ar: 'مساعد ذكي ثنائي اللغة' },
    { icon: '📄', fr: 'Génération PDF & Word', ar: 'توليد وثائق PDF و Word' },
    { icon: '🔍', fr: 'Base de connaissances RAG', ar: 'قاعدة معرفة RAG' },
    { icon: '🔒', fr: 'Sécurité avancée JWT', ar: 'أمان JWT متقدم' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  selectRole(role: string) {
    this.selectedRole = role;
    this.roleSelected = true;
    this.showRegister = false;
    this.error = '';
    // ✅ Jamais pré-rempli — l'utilisateur tape toujours
    this.username = '';
    this.password = '';
  }

  login() {
    if (!this.username || !this.password) {
      this.error = this.selectedLang === 'ar'
        ? 'يرجى ملء جميع الحقول'
        : 'Veuillez remplir tous les champs';
      return;
    }
    this.loading = true;
    this.error = '';

    this.authService.login({
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        // ✅ Redirection selon le rôle RÉEL en BD
        if (res.role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/chat']);
        }
      },
      error: () => {
        this.loading = false;
        this.error = this.selectedLang === 'ar'
          ? 'اسم المستخدم أو كلمة المرور غير صحيحة'
          : 'Identifiants incorrects';
      }
    });
  }

  registerProf() {
    if (!this.regForm.username || !this.regForm.password || !this.regForm.email) {
      alert('Veuillez remplir tous les champs obligatoires !');
      return;
    }
    this.loading = true;
    this.authService.register({
      username: this.regForm.username,
      email: this.regForm.email,
      password: this.regForm.password
    }).subscribe({
      next: () => {
        this.loading = false;
        alert('✅ Compte créé ! Connectez-vous maintenant.');
        this.showRegister = false;
        this.username = this.regForm.username;
        this.password = '';
      },
      error: () => {
        this.loading = false;
        alert('❌ Username ou email déjà utilisé');
      }
    });
  }

  goToRegister() { this.router.navigate(['/register']); }
}