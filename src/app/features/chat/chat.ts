import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService, ChatMessage } from '../../core/chat';
import { AuthService } from '../../core/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss'
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesEnd') private messagesContainer!: ElementRef;

  // Navigation
  activeTab: 'chat' | 'notes' | 'emploi' | 'infos' = 'chat';

  // Chat
  messages: ChatMessage[] = [];
  messageInput = '';
  loading = false;
  selectedLang: 'fr' | 'ar' = 'fr';
  welcomeShown = true;
  historyLoading = false;

  // Étudiant
  studentInfo: any = null;
  notes: any[] = [];
  emploi: any[] = [];
  moyenne: any = null;
  loadingNotes = false;
  loadingEmploi = false;

  // Document modal
  showDocModal = false;
  docType = 'certificat';
  docName = '';
  docFormat: 'PDF' | 'DOCX' = 'PDF';
  docEtablissement = '';
  docFiliere = '';
  docAnnee = '2024/2025';
  docNiveau = 'Licence 1';
  docEmployeur = '';
  docPoste = '';
  docDateEmbauche = '';
  docSalaire = '';
  docDepartement = '';
  docObjet = '';
  docDestinataire = '';
  docContenu = '';

  suggestions = [
    '📋 Voir mon relevé de notes',
    '📅 Mon emploi du temps',
    '🎓 Générer un certificat de scolarité',
    '❓ Informations sur les services'
  ];

  jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  constructor(
    public chatService: ChatService,
    public authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadStudentInfo();
    this.loadNotes();
    this.loadEmploi();
    this.loadHistory();
  }

  ngAfterViewChecked() { this.scrollToBottom(); }

  getHeaders() {
    return new HttpHeaders({
      'Authorization': 'Bearer ' + this.authService.getToken(),
      'Content-Type': 'application/json'
    });
  }

  loadStudentInfo() {
    const userId = this.authService.getUserId();
    this.http.get(`/api/student/info/${userId}`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => { this.studentInfo = data; },
        error: () => {
          this.studentInfo = {
            username: this.authService.getUsername(),
            email: '',
            role: 'USER'
          };
        }
      });

    this.http.get(`/api/student/moyenne/${userId}`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => { this.moyenne = data; },
        error: () => {}
      });
  }

  loadNotes() {
  this.loadingNotes = true;
  const userId = this.authService.getUserId();
  this.http.get<any[]>(`/api/student/notes/${userId}`,
    { headers: this.getHeaders() })
    .subscribe({
      next: (data) => {
        // ✅ Seulement les vraies données de la BD
        this.notes = data || [];
        this.loadingNotes = false;
      },
      error: () => {
        this.notes = [];
        this.loadingNotes = false;
      }
    });
}

loadEmploi() {
  this.loadingEmploi = true;
  const userId = this.authService.getUserId();
  this.http.get<any[]>(`/api/student/emploi/${userId}`,
    { headers: this.getHeaders() })
    .subscribe({
      next: (data) => {
        // ✅ Seulement les vraies données de la BD
        this.emploi = data || [];
        this.loadingEmploi = false;
      },
      error: () => {
        this.emploi = [];
        this.loadingEmploi = false;
      }
    });
}

  getEmploiByJour(jour: string) {
    return this.emploi.filter(e => e.jour === jour);
  }

  getMoyenneNote(notes: any[]) {
    if (!notes.length) return 0;
    let total = 0, coeff = 0;
    notes.forEach(n => { total += n.note * n.coefficient; coeff += n.coefficient; });
    return coeff > 0 ? Math.round((total / coeff) * 100) / 100 : 0;
  }

  getNoteColor(note: number): string {
    if (note >= 16) return '#16a34a';
    if (note >= 14) return '#0052cc';
    if (note >= 12) return '#f59e0b';
    if (note >= 10) return '#ea580c';
    return '#dc2626';
  }

  getNotesBySemestre(semestre: string) {
    return this.notes.filter(n => n.semestre === semestre);
  }

  getSemestres() {
    return [...new Set(this.notes.map(n => n.semestre))];
  }

  loadHistory() {
    this.historyLoading = true;
    const userId = this.authService.getUserId();
    this.chatService.getChatHistory(userId).subscribe({
      next: (history: any[]) => {
        if (history && history.length > 0) {
          this.messages = history.map(m => ({
            content: m.content,
            sender: m.sender as 'user' | 'bot',
            language: m.language as 'fr' | 'ar',
            timestamp: new Date(m.createdAt)
          }));
          this.welcomeShown = false;
        }
        this.historyLoading = false;
      },
      error: () => { this.historyLoading = false; }
    });
  }

  scrollToBottom() {
    try {
      if (this.messagesContainer && this.activeTab === 'chat')
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
    } catch (e) {}
  }

  setLang(lang: 'fr' | 'ar') { this.selectedLang = lang; }

  sendSuggestion(text: string) {
    const clean = text.replace(/^[^\s]+\s/, '');
    if (clean.includes('relevé de notes') || clean.includes('notes')) {
      this.activeTab = 'notes';
      return;
    }
    if (clean.includes('emploi du temps')) {
      this.activeTab = 'emploi';
      return;
    }
    this.activeTab = 'chat';
    this.messageInput = clean;
    this.sendMessage();
  }

 sendMessage() {
  const text = this.messageInput.trim();
  if (!text || this.loading) return;

  const lower = text.toLowerCase();

  // Détection notes
  if (lower.includes('note') || lower.includes('relevé') || lower.includes('résultat') ||
      lower.includes('نتائج') || lower.includes('نقاط')) {
    this.activeTab = 'notes';
    this.welcomeShown = false;
    this.messages.push({ content: text, sender: 'user', language: this.selectedLang, timestamp: new Date() });
    this.messages.push({ content: '📊 Voici votre relevé de notes !', sender: 'bot', language: this.selectedLang, timestamp: new Date() });
    this.messageInput = '';
    return;
  }

  // Détection emploi
  if (lower.includes('emploi') || lower.includes('horaire') || lower.includes('cours') ||
      lower.includes('جدول') || lower.includes('مواعيد')) {
    this.activeTab = 'emploi';
    this.welcomeShown = false;
    this.messages.push({ content: text, sender: 'user', language: this.selectedLang, timestamp: new Date() });
    this.messages.push({ content: '📅 Voici votre emploi du temps !', sender: 'bot', language: this.selectedLang, timestamp: new Date() });
    this.messageInput = '';
    return;
  }

  // Détection attestation/certificat → ouvre formulaire
  if (lower.includes('attestation') || lower.includes('certificat') ||
      lower.includes('document') || lower.includes('شهادة') || lower.includes('وثيقة')) {
    this.welcomeShown = false;
    this.messages.push({ content: text, sender: 'user', language: this.selectedLang, timestamp: new Date() });
    this.messages.push({ content: '📄 Je vous ouvre le formulaire de génération de document !', sender: 'bot', language: this.selectedLang, timestamp: new Date() });
    this.messageInput = '';
    setTimeout(() => { this.showDocModal = true; }, 500);
    return;
  }

  // Détection infos
  if (lower.includes('info') || lower.includes('profil') || lower.includes('compte') ||
      lower.includes('معلومات') || lower.includes('حساب')) {
    this.activeTab = 'infos';
    this.welcomeShown = false;
    this.messages.push({ content: text, sender: 'user', language: this.selectedLang, timestamp: new Date() });
    this.messages.push({ content: '👤 Voici vos informations !', sender: 'bot', language: this.selectedLang, timestamp: new Date() });
    this.messageInput = '';
    return;
  }

  // Sinon appel Groq
  this.welcomeShown = false;
  this.messages.push({ content: text, sender: 'user', language: this.selectedLang, timestamp: new Date() });
  this.messageInput = '';
  this.loading = true;
  this.activeTab = 'chat';

  this.chatService.sendMessage({ message: text, language: this.selectedLang }).subscribe({
    next: (res) => {
      this.messages.push({ content: res.response, sender: 'bot', language: res.language, timestamp: new Date() });
      this.loading = false;
    },
    error: () => {
      this.messages.push({ content: '❌ Erreur de connexion au serveur.', sender: 'bot', language: this.selectedLang, timestamp: new Date() });
      this.loading = false;
    }
  });
}

  handleKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  newChat() {
    this.messages = [];
    this.welcomeShown = true;
    this.activeTab = 'chat';
  }

  logout() { this.authService.logout(); }
  openDocModal() { this.showDocModal = true; }
  closeDocModal() { this.showDocModal = false; }

  generateDocument() {
    if (!this.docName) return;
    const data: any = { name: this.docName };
    if (this.docType === 'attestation') {
      data.employeur = this.docEmployeur;
      data.poste = this.docPoste;
      data.dateEmbauche = this.docDateEmbauche;
      data.salaire = this.docSalaire;
      data.departement = this.docDepartement;
    } else if (this.docType === 'certificat') {
      data.etablissement = this.docEtablissement;
      data.filiere = this.docFiliere;
      data.annee = this.docAnnee;
      data.niveau = this.docNiveau;
    } else {
      data.objet = this.docObjet;
      data.destinataire = this.docDestinataire;
      data.contenu = this.docContenu;
    }
    this.chatService.generateDocument({
      type: this.docType, data, format: this.docFormat, language: this.selectedLang
    }).subscribe({
      next: (blob) => {
        this.chatService.downloadDocument(blob, `${this.docType}.${this.docFormat.toLowerCase()}`);
        this.closeDocModal();
        this.messages.push({
          content: `✅ Document généré et téléchargé !`,
          sender: 'bot', language: this.selectedLang, timestamp: new Date()
        });
        this.activeTab = 'chat';
        this.welcomeShown = false;
      },
      error: () => { alert('Erreur génération document'); }
    });
  }

  getTime(date: Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getTypeColor(type: string): string {
    if (type === 'TP') return '#f59e0b';
    if (type === 'TD') return '#0052cc';
    return '#16a34a';
  }
}