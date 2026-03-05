import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  content: string;
  sender: 'user' | 'bot';
  language: 'fr' | 'ar';
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  language: 'fr' | 'ar';
}

export interface ChatResponse {
  response: string;
  language: 'fr' | 'ar';
}

export interface DocumentRequest {
  type: string;
  data: { name: string; [key: string]: any };
  format: 'PDF' | 'DOCX';
  language: 'fr' | 'ar';
}

@Injectable({ providedIn: 'root' })
export class ChatService {

  constructor(private http: HttpClient) {}

  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>('/api/chat/send', request);
  }

  getChatHistory(userId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`/api/chat/history/${userId}`);
  }

  generateDocument(request: DocumentRequest): Observable<Blob> {
    return this.http.post('/api/documents/generate', request, {
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