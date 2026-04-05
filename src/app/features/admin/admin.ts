import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminComponent implements OnInit {

  activeTab = 'dashboard';
  loading = false;

  stats: any = {
    totalUsers: 0, totalProfesseurs: 0,
    totalSalles: 0, totalMatieres: 0, totalCours: 0
  };

  users: any[] = [];
  professeurs: any[] = [];
  salles: any[] = [];
  matieres: any[] = [];
  emplois: any[] = [];
  etudiantsEnregistres: any[] = [];

  showForm = false;
  editMode = false;
  currentId: any = null;

  profForm: any = { nom: '', prenom: '', email: '', telephone: '', specialite: '', grade: '' };
  salleForm: any = { nom: '', type: 'cours', capacite: 30, batiment: '', equipements: '' };
  matiereForm: any = { nom: '', code: '', coefficient: 1, heuresCm: 0, heuresTd: 0, heuresTp: 0, filiere: '', semestre: 'S1', professeurId: '' };
  emploiForm: any = { jour: 'Lundi', heureDebut: '08:00', heureFin: '10:00', matiere: '', salle: '', professeur: '', type: 'cours', filiere: '', groupe: '', userId: '', professeurId: '', salleId: '' };
  noteForm: any = { userId: '', matiere: '', note: '', coefficient: 1, semestre: 'S1', annee: '2024/2025' };

  nouveauPrenom = '';
  nouveauNom = '';
  nouvelleFiliere = '';
  nouveauNiveau = '';
  idGenere = '';
  idCopie = false;
  showGenerateForm = false;

  // RAG
  ragDocuments: any[] = [];
  ragLoading = false;
  ragSearchQuery = '';
  ragSearchResults: any[] = [];
  ragSearching = false;
  uploadProgress = false;

  filieres = ['Informatique', 'Génie Logiciel', 'Cybersécurité', 'Master Intelligence Artificielle', 'Gestion', 'Commerce International'];
  niveaux = ['L1', 'L2', 'L3', 'M1', 'M2'];
  jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  grades = ['Assistant', 'Maître assistant', 'Maître de conférences', 'Professeur'];
  typesSalle = ['cours', 'TP', 'TD', 'amphi', 'labo'];
  typesSeance = ['cours', 'TP', 'TD'];

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']); return;
    }
    this.loadAll();
    this.loadRagDocuments();
  }

  getHeaders() {
    return new HttpHeaders({
      'Authorization': 'Bearer ' + this.authService.getToken(),
      'Content-Type': 'application/json'
    });
  }

  loadAll() {
    this.loadStats();
    this.loadUsers();
    this.loadProfesseurs();
    this.loadSalles();
    this.loadMatieres();
    this.loadEmplois();
    this.loadEtudiants();
  }

  loadStats() {
    this.http.get<any>('/api/gestion/stats', { headers: this.getHeaders() })
      .subscribe({ next: (d) => { this.stats = { ...this.stats, ...d }; this.cdr.detectChanges(); } });
    this.http.get<any[]>('/api/admin/users', { headers: this.getHeaders() })
      .subscribe({ next: (d) => { this.stats.totalUsers = d.length; this.cdr.detectChanges(); } });
  }

  loadUsers() {
    this.http.get<any[]>('/api/admin/users', { headers: this.getHeaders() })
      .subscribe({ next: (d) => { this.users = d; this.cdr.detectChanges(); } });
  }

  loadProfesseurs() {
    this.http.get<any[]>('/api/gestion/professeurs', { headers: this.getHeaders() })
      .subscribe({ next: (d) => { this.professeurs = d; this.cdr.detectChanges(); } });
  }

  loadSalles() {
    this.http.get<any[]>('/api/gestion/salles', { headers: this.getHeaders() })
      .subscribe({ next: (d) => { this.salles = d; this.cdr.detectChanges(); } });
  }

  loadMatieres() {
    this.http.get<any[]>('/api/gestion/matieres', { headers: this.getHeaders() })
      .subscribe({ next: (d) => { this.matieres = d; this.cdr.detectChanges(); } });
  }

  loadEmplois() {
    this.http.get<any[]>('/api/gestion/emploi', { headers: this.getHeaders() })
      .subscribe({ next: (d) => { this.emplois = d; this.cdr.detectChanges(); } });
  }

  loadEtudiants() {
    const saved = localStorage.getItem('etudiants_enregistres');
    if (saved) this.etudiantsEnregistres = JSON.parse(saved);
  }

  // ══════ RAG ══════
  loadRagDocuments() {
    this.ragLoading = true;
    fetch('http://localhost:8001/documents')
      .then(r => r.json())
      .then(data => {
        this.ragDocuments = data.documents || [];
        this.ragLoading = false;
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.ragDocuments = [];
        this.ragLoading = false;
        this.cdr.detectChanges();
      });
  }

  uploadDocument(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.uploadProgress = true;
    const formData = new FormData();
    formData.append('file', file);
    fetch('http://localhost:8001/upload', { method: 'POST', body: formData })
      .then(r => r.json())
      .then(data => {
        alert('✅ ' + data.message);
        this.uploadProgress = false;
        this.loadRagDocuments();
      })
      .catch(() => {
        alert('❌ Erreur upload — vérifiez que le serveur RAG tourne sur port 8001');
        this.uploadProgress = false;
      });
  }

  clearRag() {
    if (!confirm('Vider toute la base de connaissances ?')) return;
    fetch('http://localhost:8001/documents', { method: 'DELETE' })
      .then(() => { alert('✅ Base vidée !'); this.loadRagDocuments(); })
      .catch(() => alert('❌ Erreur'));
  }

  searchRag() {
    if (!this.ragSearchQuery) return;
    this.ragSearching = true;
    this.ragSearchResults = [];
    fetch('http://localhost:8001/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: this.ragSearchQuery, n_results: 3 })
    })
    .then(r => r.json())
    .then(data => {
      this.ragSearchResults = data.results || [];
      this.ragSearching = false;
      this.cdr.detectChanges();
    })
    .catch(() => { this.ragSearching = false; });
  }

  // ══════ PROFESSEURS ══════
  saveProfesseur() {
    if (!this.profForm.nom || !this.profForm.email) { alert('Nom et email obligatoires !'); return; }
    const req = this.editMode
      ? this.http.put(`/api/gestion/professeurs/${this.currentId}`, this.profForm, { headers: this.getHeaders() })
      : this.http.post('/api/gestion/professeurs', this.profForm, { headers: this.getHeaders() });
    req.subscribe({
      next: () => { this.loadProfesseurs(); this.loadStats(); this.resetForm(); alert('✅ Professeur sauvegardé !'); },
      error: () => alert('❌ Erreur — email déjà utilisé ?')
    });
  }

  editProfesseur(p: any) { this.profForm = { ...p }; this.currentId = p.id; this.editMode = true; this.showForm = true; }

  deleteProfesseur(id: number) {
    if (!confirm('Supprimer ce professeur ?')) return;
    this.http.delete(`/api/gestion/professeurs/${id}`, { headers: this.getHeaders() })
      .subscribe({ next: () => { this.loadProfesseurs(); this.loadStats(); } });
  }

  // ══════ SALLES ══════
  saveSalle() {
    if (!this.salleForm.nom) { alert('Nom obligatoire !'); return; }
    const req = this.editMode
      ? this.http.put(`/api/gestion/salles/${this.currentId}`, this.salleForm, { headers: this.getHeaders() })
      : this.http.post('/api/gestion/salles', this.salleForm, { headers: this.getHeaders() });
    req.subscribe({
      next: () => { this.loadSalles(); this.loadStats(); this.resetForm(); alert('✅ Salle sauvegardée !'); }
    });
  }

  editSalle(s: any) { this.salleForm = { ...s }; this.currentId = s.id; this.editMode = true; this.showForm = true; }

  deleteSalle(id: number) {
    if (!confirm('Supprimer cette salle ?')) return;
    this.http.delete(`/api/gestion/salles/${id}`, { headers: this.getHeaders() })
      .subscribe({ next: () => { this.loadSalles(); this.loadStats(); } });
  }

  // ══════ MATIÈRES ══════
  saveMatiere() {
    if (!this.matiereForm.nom) { alert('Nom obligatoire !'); return; }
    const req = this.editMode
      ? this.http.put(`/api/gestion/matieres/${this.currentId}`, this.matiereForm, { headers: this.getHeaders() })
      : this.http.post('/api/gestion/matieres', this.matiereForm, { headers: this.getHeaders() });
    req.subscribe({
      next: () => { this.loadMatieres(); this.loadStats(); this.resetForm(); alert('✅ Matière sauvegardée !'); }
    });
  }

  editMatiere(m: any) { this.matiereForm = { ...m }; this.currentId = m.id; this.editMode = true; this.showForm = true; }

  deleteMatiere(id: number) {
    if (!confirm('Supprimer cette matière ?')) return;
    this.http.delete(`/api/gestion/matieres/${id}`, { headers: this.getHeaders() })
      .subscribe({ next: () => { this.loadMatieres(); this.loadStats(); } });
  }

  // ══════ EMPLOI DU TEMPS ══════
  saveEmploi() {
    if (!this.emploiForm.jour || !this.emploiForm.matiere) { alert('Jour et matière obligatoires !'); return; }
    this.http.post('/api/gestion/emploi', this.emploiForm, { headers: this.getHeaders() })
      .subscribe({
        next: () => { this.loadEmplois(); this.loadStats(); this.resetForm(); alert('✅ Cours ajouté !'); }
      });
  }

  deleteEmploi(id: number) {
    if (!confirm('Supprimer ce cours ?')) return;
    this.http.delete(`/api/gestion/emploi/${id}`, { headers: this.getHeaders() })
      .subscribe({ next: () => this.loadEmplois() });
  }

  getEmploiByJour(jour: string) { return this.emplois.filter(e => e.jour === jour); }

  // ══════ NOTES ══════
  saveNote() {
    if (!this.noteForm.userId || !this.noteForm.matiere || !this.noteForm.note) {
      alert('Tous les champs sont obligatoires !'); return;
    }
    this.http.post('/api/gestion/notes', this.noteForm, { headers: this.getHeaders() })
      .subscribe({ next: () => { this.resetForm(); alert('✅ Note ajoutée !'); } });
  }

  // ══════ ID ÉTUDIANT ══════
  genererEtudiant() {
    if (!this.nouveauPrenom || !this.nouveauNom || !this.nouvelleFiliere || !this.nouveauNiveau) {
      alert('Veuillez remplir tous les champs !'); return;
    }
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    this.idGenere = timestamp + random;
    const etudiant = {
      id: this.idGenere, prenom: this.nouveauPrenom, nom: this.nouveauNom,
      filiere: this.nouvelleFiliere, niveau: this.nouveauNiveau,
      dateCreation: new Date().toLocaleDateString('fr-FR'), statut: 'En attente'
    };
    this.etudiantsEnregistres.unshift(etudiant);
    localStorage.setItem('etudiants_enregistres', JSON.stringify(this.etudiantsEnregistres));
    this.cdr.detectChanges();
  }

  copierID() {
    if (this.idGenere) {
      navigator.clipboard.writeText(this.idGenere);
      this.idCopie = true;
      setTimeout(() => { this.idCopie = false; }, 2000);
    }
  }

  resetGenerate() {
    this.nouveauPrenom = ''; this.nouveauNom = '';
    this.nouvelleFiliere = ''; this.nouveauNiveau = '';
    this.idGenere = ''; this.idCopie = false; this.showGenerateForm = false;
  }

  supprimerEtudiant(id: string) {
    this.etudiantsEnregistres = this.etudiantsEnregistres.filter(e => e.id !== id);
    localStorage.setItem('etudiants_enregistres', JSON.stringify(this.etudiantsEnregistres));
    this.cdr.detectChanges();
  }

  getProfNom(id: any) {
    const p = this.professeurs.find(x => x.id == id);
    return p ? `${p.prenom} ${p.nom}` : '-';
  }

  getSalleNom(id: any) {
    const s = this.salles.find(x => x.id == id);
    return s ? s.nom : '-';
  }

  resetForm() {
  // ✅ Ne ferme plus showForm automatiquement
  this.editMode = false;
  this.currentId = null;
  this.profForm = { nom: '', prenom: '', email: '', telephone: '', specialite: '', grade: '' };
  this.salleForm = { nom: '', type: 'cours', capacite: 30, batiment: '', equipements: '' };
  this.matiereForm = { nom: '', code: '', coefficient: 1, heuresCm: 0, heuresTd: 0, heuresTp: 0, filiere: '', semestre: 'S1', professeurId: '' };
  this.emploiForm = { jour: 'Lundi', heureDebut: '08:00', heureFin: '10:00', matiere: '', salle: '', professeur: '', type: 'cours', filiere: '', groupe: '', userId: '', professeurId: '', salleId: '' };
  this.noteForm = { userId: '', matiere: '', note: '', coefficient: 1, semestre: 'S1', annee: '2024/2025' };
}

  getTypeColor(type: string): string {
    if (type === 'TP') return '#f59e0b';
    if (type === 'TD') return '#0052cc';
    return '#16a34a';
  }

  goToChat() { this.router.navigate(['/chat']); }
  logout() { this.authService.logout(); }
}