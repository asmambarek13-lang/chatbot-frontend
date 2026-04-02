import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login';
import { ChatComponent } from './features/chat/chat';
import { AdminComponent } from './features/admin/admin';
import { RegisterComponent } from './features/register/register';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },  // ← AJOUTE
  { path: 'chat', component: ChatComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: 'login' }
];