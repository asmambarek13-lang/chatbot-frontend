import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatRequest {
  message: string;
  language: 'fr' | 'ar';
  sessionId?: string;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  language: 'fr' | 'ar';
}

export interface ChatMessage {
  content: string;
  sender: 'user' | 'bot';
  language: 'fr' | 'ar';
  timestamp: Date;
}

export interface DocumentRequest {
  type: string;
  data: Record<string, string>;
  format: 'PDF' | 'DOCX';
  language: 'fr' | 'ar';
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private api = '/api';
  constructor(private http: HttpClient) {}

  sendMessage(req: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.api}/chat/send`, req);
  }

  getHistory(sessionId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.api}/chat/history/${sessionId}`);
  }

  generateDocument(req: DocumentRequest): Observable<Blob> {
    return this.http.post(`${this.api}/documents/generate`, req, {
      responseType: 'blob'
    });
  }

  downloadDocument(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}