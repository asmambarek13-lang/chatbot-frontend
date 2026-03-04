import { Component, OnInit } from '@angular/core';
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
export class ChatComponent implements OnInit {
  messages: ChatMessage[] = [];
  messageInput = '';
  loading = false;
  selectedLang: 'fr' | 'ar' = 'fr';
  welcomeShown = true;

  suggestions = [
    '📋 Demander une attestation',
    '📜 Générer un certificat',
    '❓ Informations sur les services',
    '🗂 Soumettre une demande'
  ];

  showDocModal = false;
  docType = 'attestation';
  docName = '';
  docFormat: 'PDF' | 'DOCX' = 'PDF';

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  setLang(lang: 'fr' | 'ar') {
    this.selectedLang = lang;
  }

  sendSuggestion(text: string) {
    this.messageInput = text.replace(/^[^\s]+\s/, '');
    this.sendMessage();
  }

  sendMessage() {
    const text = this.messageInput.trim();
    if (!text || this.loading) return;

    this.welcomeShown = false;
    this.messages.push({
      content: text,
      sender: 'user',
      language: this.selectedLang,
      timestamp: new Date()
    });

    this.messageInput = '';
    this.loading = true;

    const req: ChatRequest = {
      message: text,
      language: this.selectedLang
    };

    this.chatService.sendMessage(req).subscribe({
      next: (res) => {
        this.messages.push({
          content: res.response,
          sender: 'bot',
          language: res.language,
          timestamp: new Date()
        });
        this.loading = false;
      },
      error: () => {
        this.messages.push({
          content: '❌ Erreur de connexion au serveur.',
          sender: 'bot',
          language: 'fr',
          timestamp: new Date()
        });
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
  }

  logout() {
    this.authService.logout();
  }

  openDocModal() { this.showDocModal = true; }
  closeDocModal() { this.showDocModal = false; }

  generateDocument() {
    if (!this.docName) return;
    this.chatService.generateDocument({
      type: this.docType,
      data: { name: this.docName },
      format: this.docFormat,
      language: this.selectedLang
    }).subscribe({
      next: (blob) => {
        this.chatService.downloadDocument(
          blob,
          `${this.docType}.${this.docFormat.toLowerCase()}`
        );
        this.closeDocModal();
      },
      error: () => {
        alert('Erreur lors de la génération du document');
      }
    });
  }

  getTime(date: Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit'
    });
  }
}