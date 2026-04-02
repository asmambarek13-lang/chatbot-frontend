import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rag',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rag-section">
      <div class="section-header">
        <h2>🧠 Base de connaissances RAG</h2>
        <span class="badge">{{ totalChunks }} chunks indexés</span>
      </div>

      <!-- Upload Zone -->
      <div class="upload-zone" (click)="fileInput.click()"
           (dragover)="$event.preventDefault()"
           (drop)="onDrop($event)"
           [class.uploading]="uploading">
        <input #fileInput type="file" hidden
               accept=".pdf,.docx,.txt"
               (change)="onFileSelected($event)"/>
        <div class="upload-icon">📂</div>
        <p class="upload-title">{{ uploading ? 'Upload en cours...' : 'Glissez ou cliquez pour uploader' }}</p>
        <p class="upload-hint">PDF, DOCX, TXT supportés</p>
        <div class="upload-spinner" *ngIf="uploading">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Message -->
      <div class="upload-msg success" *ngIf="successMsg">✅ {{ successMsg }}</div>
      <div class="upload-msg error" *ngIf="errorMsg">❌ {{ errorMsg }}</div>

      <!-- Documents indexés -->
      <div class="docs-list" *ngIf="documents.length > 0">
        <div class="docs-title">📚 Documents indexés :</div>
        <div class="doc-item" *ngFor="let doc of documents">
          <span class="doc-icon">📄</span>
          <span class="doc-name">{{ doc }}</span>
        </div>
      </div>

      <div class="empty-rag" *ngIf="documents.length === 0 && !uploading">
        <p>Aucun document indexé. Uploadez des fichiers pour enrichir la base de connaissances !</p>
      </div>

      <!-- Clear -->
      <button class="clear-btn" *ngIf="documents.length > 0" (click)="clearAll()">
        🗑️ Vider la base de connaissances
      </button>
    </div>
  `,
  styles: [`
    .rag-section {
      background: white;
      border: 2px solid rgba(244,114,182,0.18);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(244,114,182,0.07);
      margin-top: 24px;
    }
    .section-header {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 18px 24px;
      border-bottom: 2px solid rgba(244,114,182,0.18);
      background: rgba(244,114,182,0.03);
    }
    .section-header h2 { font-size: 1rem; font-weight: 800; color: #1a1a2e; }
    .badge {
      background: linear-gradient(135deg, #f472b6, #ec4899);
      color: #fff; padding: 4px 12px;
      border-radius: 20px; font-size: 0.75rem; font-weight: 700;
    }
    .upload-zone {
      margin: 20px 24px;
      border: 2px dashed rgba(244,114,182,0.4);
      border-radius: 12px; padding: 30px;
      text-align: center; cursor: pointer;
      transition: all 0.2s;
      background: rgba(244,114,182,0.03);
    }
    .upload-zone:hover, .upload-zone.uploading {
      border-color: #f472b6;
      background: rgba(244,114,182,0.07);
    }
    .upload-icon { font-size: 2.5rem; margin-bottom: 10px; }
    .upload-title { font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
    .upload-hint { font-size: 0.78rem; color: #6b6b8a; }
    .upload-spinner { display: flex; justify-content: center; margin-top: 12px; }
    .spinner {
      width: 24px; height: 24px;
      border: 3px solid #fbcfe8; border-top-color: #ec4899;
      border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .upload-msg {
      margin: 0 24px 16px; padding: 10px 14px;
      border-radius: 8px; font-size: 0.85rem; font-weight: 600;
    }
    .upload-msg.success { background: rgba(34,197,94,0.1); color: #15803d; border: 1px solid rgba(34,197,94,0.2); }
    .upload-msg.error { background: rgba(244,114,182,0.1); color: #be185d; border: 1px solid rgba(244,114,182,0.2); }
    .docs-title { font-size: 0.78rem; font-weight: 800; color: #6b6b8a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; padding: 0 24px; }
    .docs-list { padding: 0 24px 16px; }
    .doc-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; border-radius: 8px;
      background: rgba(244,114,182,0.05);
      border: 1px solid rgba(244,114,182,0.15);
      margin-bottom: 6px;
    }
    .doc-name { font-size: 0.82rem; font-weight: 600; color: #1a1a2e; }
    .empty-rag { padding: 16px 24px; color: #6b6b8a; font-size: 0.82rem; font-style: italic; }
    .clear-btn {
      margin: 0 24px 20px;
      padding: 8px 16px; border-radius: 8px;
      border: 2px solid rgba(244,114,182,0.2);
      background: white; color: #be185d;
      font-size: 0.78rem; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
    }
    .clear-btn:hover { background: rgba(244,114,182,0.08); }
  `]
})
export class RagComponent implements OnInit {
  documents: string[] = [];
  totalChunks = 0;
  uploading = false;
  successMsg = '';
  errorMsg = '';

  private RAG_URL = 'http://localhost:8001';

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadDocuments(); }

  loadDocuments() {
    this.http.get<any>(`${this.RAG_URL}/documents`).subscribe({
      next: (res) => {
        this.documents = res.documents || [];
        this.totalChunks = res.total_chunks || 0;
      },
      error: () => console.log('RAG server non disponible')
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.uploadFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadFile(file);
  }

  uploadFile(file: File) {
    this.uploading = true;
    this.successMsg = '';
    this.errorMsg = '';

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<any>(`${this.RAG_URL}/upload`, formData).subscribe({
      next: (res) => {
        this.successMsg = res.message;
        this.uploading = false;
        this.loadDocuments();
      },
      error: () => {
        this.errorMsg = 'Erreur lors de l\'upload. Vérifiez que le serveur RAG tourne.';
        this.uploading = false;
      }
    });
  }

  clearAll() {
    if (!confirm('Vider toute la base de connaissances ?')) return;
    this.http.delete<any>(`${this.RAG_URL}/documents`).subscribe({
      next: () => {
        this.documents = [];
        this.totalChunks = 0;
        this.successMsg = 'Base de connaissances vidée !';
      }
    });
  }
}