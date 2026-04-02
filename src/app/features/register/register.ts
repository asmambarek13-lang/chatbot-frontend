import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  constructor(private router: Router) {}

  lang = 'fr';
  currentStep = 1;
  totalSteps = 6;
  submitted = false;
  showPwd = false;
  identifiantValide = false;
  identifiantInvalide = false;

  steps = ['Identité', 'Contact', 'Bac', 'Formation', 'Finance', 'Compte'];
  bacYears = Array.from({length: 15}, (_, i) => (2024 - i).toString());

  form: any = {
    prenom: '', nom: '', dateNaissance: '', lieuNaissance: '',
    sexe: '', nationalite: 'Tunisienne', cin: '',
    email: '', telephone: '', adresse: '',
    anneeBac: '', sectionBac: '', moyenneBac: '', lycee: '', niveau: '',
    filiere: '', niveauIntegration: '', typeInscription: '',
    modePaiement: '', bourse: '',
    identifiantFaculte: '', username: '', password: '', confirmPassword: ''
  };

  toggleLang() { this.lang = this.lang === 'fr' ? 'ar' : 'fr'; }

  validateIdentifiant() {
    const id = this.form.identifiantFaculte;
    if (id && id.length === 12 && /^\d+$/.test(id)) {
      this.identifiantValide = true;
      this.identifiantInvalide = false;
    } else if (id && id.length >= 1) {
      this.identifiantValide = false;
      this.identifiantInvalide = id.length > 0 && id.length !== 12;
    } else {
      this.identifiantValide = false;
      this.identifiantInvalide = false;
    }
  }

  nextStep() {
    if (this.validateStep() && this.currentStep < this.totalSteps) {
      this.currentStep++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  validateStep(): boolean {
    switch (this.currentStep) {
      case 1:
        if (!this.form.prenom || !this.form.nom || !this.form.dateNaissance || !this.form.sexe || !this.form.cin) {
          alert('Veuillez remplir tous les champs obligatoires (*)'); return false;
        }
        break;
      case 2:
        if (!this.form.email || !this.form.telephone || !this.form.adresse) {
          alert('Veuillez remplir tous les champs obligatoires (*)'); return false;
        }
        if (!this.form.email.includes('@')) {
          alert('Email invalide'); return false;
        }
        break;
      case 3:
        if (!this.form.anneeBac || !this.form.lycee) {
          alert('Veuillez remplir tous les champs obligatoires (*)'); return false;
        }
        break;
      case 4:
        if (!this.form.filiere || !this.form.niveauIntegration || !this.form.typeInscription) {
          alert('Veuillez remplir tous les champs obligatoires (*)'); return false;
        }
        break;
      case 5:
        if (!this.form.modePaiement || !this.form.bourse) {
          alert('Veuillez choisir un mode de paiement et indiquer votre statut bourse'); return false;
        }
        break;
      case 6:
        if (!this.form.identifiantFaculte || !this.identifiantValide) {
          alert('Identifiant faculté invalide (12 chiffres requis)'); return false;
        }
        if (!this.form.username || !this.form.password || !this.form.confirmPassword) {
          alert('Veuillez remplir tous les champs obligatoires (*)'); return false;
        }
        if (this.form.password !== this.form.confirmPassword) {
          alert('Les mots de passe ne correspondent pas'); return false;
        }
        if (this.form.password.length < 6) {
          alert('Mot de passe trop court (min 6 caractères)'); return false;
        }
        break;
    }
    return true;
  }

  submitForm() {
    if (!this.validateStep()) return;
    console.log('Formulaire soumis:', this.form);
    this.submitted = true;
  }

  goToLogin() { this.router.navigate(['/login']); }
}