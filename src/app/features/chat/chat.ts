import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService, ChatMessage, ChatRequest } from '../../core/chat';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesEnd') private messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  messageInput = '';
  loading = false;
  selectedLang: 'fr' | 'ar' = 'fr';
  welcomeShown = true;
  historyLoading = false;
  conversations: { id: number; preview: string; date: Date }[] = [];

  suggestions = [
    '📋 Demander une attestation',
    '📜 Générer un certificat',
    '❓ Informations sur les services',
    '🗂 Soumettre une demande'
  ];

  // Modal
  showDocModal = false;
  docType = 'attestation';
  docName = '';
  docFormat: 'PDF' | 'DOCX' = 'PDF';

  // Attestation de travail
  docEmployeur = '';
  docPoste = '';
  docDateEmbauche = '';
  docSalaire = '';
  docDepartement = '';

  // Certificat de scolarité
  docEtablissement = '';
  docFiliere = '';
  docAnnee = '2024/2025';
  docNiveau = 'Licence 3';

  // Lettre de demande
  docObjet = '';
  docDestinataire = '';
  docContenu = '';

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadHistory();
  }

  ngAfterViewChecked() { this.scrollToBottom(); }

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
          const firstUserMsg = history.find(m => m.sender === 'user');
          if (firstUserMsg) {
            this.conversations = [{
              id: 1,
              preview: firstUserMsg.content.substring(0, 30) + '...',
              date: new Date(firstUserMsg.createdAt)
            }];
          }
        }
        this.historyLoading = false;
      },
      error: () => { this.historyLoading = false; }
    });
  }

  scrollToBottom() {
    try {
      if (this.messagesContainer)
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
    } catch (e) {}
  }

  setLang(lang: 'fr' | 'ar') { this.selectedLang = lang; }

  sendSuggestion(text: string) {
    this.messageInput = text.replace(/^[^\s]+\s/, '');
    this.sendMessage();
  }

  sendMessage() {
    const text = this.messageInput.trim();
    if (!text || this.loading) return;

    // ✅ Détection d'intention
    this.detectIntent(text);

    this.welcomeShown = false;
    this.messages.push({
      content: text,
      sender: 'user',
      language: this.selectedLang,
      timestamp: new Date()
    });
    this.messageInput = '';
    this.loading = true;

    this.chatService.sendMessage({ message: text, language: this.selectedLang }).subscribe({
      next: (res) => {
        this.messages.push({
          content: res.response,
          sender: 'bot',
          language: res.language,
          timestamp: new Date()
        });
        this.loading = false;
        if (this.conversations.length === 0) {
          this.conversations = [{
            id: 1,
            preview: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
            date: new Date()
          }];
        }
      },
      error: () => {
        this.messages.push({
          content: this.selectedLang === 'ar'
            ? '❌ خطأ في الاتصال بالخادم.'
            : '❌ Erreur de connexion au serveur.',
          sender: 'bot',
          language: this.selectedLang,
          timestamp: new Date()
        });
        this.loading = false;
      }
    });
  }

  // ✅ DÉTECTION D'INTENTION
  detectIntent(text: string) {
    fetch('http://localhost:8001/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, language: this.selectedLang })
    })
    .then(res => res.json())
    .then(result => {
      console.log('Intent détecté:', result);
      if (result.intent === 'GENERATE_ATTESTATION') {
        this.docType = 'attestation';
        setTimeout(() => { this.showDocModal = true; }, 500);
      } else if (result.intent === 'GENERATE_CERTIFICAT') {
        this.docType = 'certificat';
        setTimeout(() => { this.showDocModal = true; }, 500);
      } else if (result.intent === 'GENERATE_DEMANDE') {
        this.docType = 'demande';
        setTimeout(() => { this.showDocModal = true; }, 500);
      }
    })
    .catch(() => {});
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
    this.conversations = [];
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
    } else if (this.docType === 'demande') {
      data.objet = this.docObjet;
      data.destinataire = this.docDestinataire;
      data.contenu = this.docContenu;
    }

    this.chatService.generateDocument({
      type: this.docType,
      data: data,
      format: this.docFormat,
      language: this.selectedLang
    }).subscribe({
      next: (blob) => {
        this.chatService.downloadDocument(
          blob,
          `${this.docType}.${this.docFormat.toLowerCase()}`
        );
        this.closeDocModal();
        this.messages.push({
          content: this.selectedLang === 'ar'
            ? `✅ تم توليد ${this.getDocTypeName()} بنجاح وتم تحميله!`
            : `✅ ${this.getDocTypeName()} généré avec succès et téléchargé !`,
          sender: 'bot',
          language: this.selectedLang,
          timestamp: new Date()
        });
        this.welcomeShown = false;
      },
      error: () => {
        alert(this.selectedLang === 'ar'
          ? 'خطأ في توليد الوثيقة'
          : 'Erreur lors de la génération du document');
      }
    });
  }

  getDocTypeName(): string {
    if (this.selectedLang === 'ar') {
      return this.docType === 'attestation' ? 'شهادة العمل'
        : this.docType === 'certificat' ? 'شهادة التمدرس' : 'رسالة الطلب';
    }
    return this.docType === 'attestation' ? "l'attestation de travail"
      : this.docType === 'certificat' ? 'le certificat de scolarité' : 'la lettre de demande';
  }

  getTime(date: Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit'
    });
  }
}