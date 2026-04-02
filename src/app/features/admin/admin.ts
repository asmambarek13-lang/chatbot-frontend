import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminComponent implements OnInit {

  activeTab = 'dashboard';
  users: any[] = [];
  totalUsers = 0;
  loading = true;

  // Générer ID étudiant
  nouveauPrenom = '';
  nouveauNom = '';
  nouvelleFiliere = '';
  nouveauNiveau = '';
  idGenere = '';
  idCopie = false;
  showGenerateForm = false;
  etudiantsEnregistres: any[] = [];

  stats = [
    { label: 'Utilisateurs', value: 0, icon: '👥' },
    { label: 'Conversations', value: 0, icon: '💬' },
    { label: 'Documents générés', value: 0, icon: '📄' },
    { label: 'Requêtes today', value: 0, icon: '📊' },
  ];

  filieres = [
    'Informatique', 'Génie Logiciel', 'Cybersécurité',
    'Master Intelligence Artificielle', 'Gestion', 'Commerce International'
  ];

  niveaux = ['L1', 'L2', 'L3', 'M1', 'M2'];

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
    this.loadEtudiants();
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
    .catch(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  loadEtudiants() {
    const saved = localStorage.getItem('etudiants_enregistres');
    if (saved) {
      this.etudiantsEnregistres = JSON.parse(saved);
    }
  }

  genererID(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return timestamp + random;
  }

  genererEtudiant() {
    if (!this.nouveauPrenom || !this.nouveauNom || !this.nouvelleFiliere || !this.nouveauNiveau) {
      alert('Veuillez remplir tous les champs !');
      return;
    }

    this.idGenere = this.genererID();

    const etudiant = {
      id: this.idGenere,
      prenom: this.nouveauPrenom,
      nom: this.nouveauNom,
      filiere: this.nouvelleFiliere,
      niveau: this.nouveauNiveau,
      dateCreation: new Date().toLocaleDateString('fr-FR'),
      statut: 'En attente'
    };

    this.etudiantsEnregistres.unshift(etudiant);
    localStorage.setItem('etudiants_enregistres', JSON.stringify(this.etudiantsEnregistres));
    this.stats[0].value = this.etudiantsEnregistres.length;
    this.cdr.detectChanges();
  }

  copierID() {
    if (this.idGenere) {
      navigator.clipboard.writeText(this.idGenere);
      this.idCopie = true;
      setTimeout(() => { this.idCopie = false; }, 2000);
    }
  }

  resetForm() {
    this.nouveauPrenom = '';
    this.nouveauNom = '';
    this.nouvelleFiliere = '';
    this.nouveauNiveau = '';
    this.idGenere = '';
    this.idCopie = false;
    this.showGenerateForm = false;
  }

  supprimerEtudiant(id: string) {
    this.etudiantsEnregistres = this.etudiantsEnregistres.filter(e => e.id !== id);
    localStorage.setItem('etudiants_enregistres', JSON.stringify(this.etudiantsEnregistres));
    this.cdr.detectChanges();
  }

  goToChat() { this.router.navigate(['/chat']); }

  logout() { this.authService.logout(); }
}