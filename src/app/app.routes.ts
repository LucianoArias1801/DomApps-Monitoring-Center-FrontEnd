// ? ==========================================================================
// ? 1. CONFIGURACIÓN DEL ENRUTAMIENTO GLOBAL DINÁMICO - DOMAPPS
// ? ==========================================================================
import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from './services/auth/auth'; 


// 2. Guardián de seguridad (Verifica sesión activa)
const authGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const isAuth = auth.isAuthenticated();
  
  console.log('🛡️ [Rastreo Guard] ¿Tiene sesión activa según el servicio?:', isAuth);
  console.log('🔑 [Rastreo Guard] Token actual en memoria:', auth.getToken());
  
  if (isAuth) {
    console.log('✅ [Rastreo Guard] Acceso PERMITIDO a la bitácora.');
    return true; 
  } else {
    console.warn('🚨 [Rastreo Guard] Acceso DENEGADO. Redirigiendo al login...');
    router.navigate(['/login']); 
    return false;
  }
};

export const routes: Routes = [
  //* Redirección Inicial Inteligente
  // Al apuntar a records/2, si tiene sesión entra directo, si no, el guard lo manda a login
  {
    path: '',
    redirectTo: 'records/2',
    pathMatch: 'full',
  },
  
  //* Ruta de la pantalla de Login (Pública)
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
  },
  
  //* ==========================================================================
  //* RUTA MAESTRA DINÁMICA (El Portal Universal de Registros)
  //* ==========================================================================
  {
    // El ":templateId" captura el número del formulario (ej. /records/1 o /records/2)
    path: 'records/:templateId', 
    canActivate: [authGuard],
    // 🚀 CARGA DE LA NUEVA PÁGINA REFACTORIZADA DE LA FASE 6
    loadComponent: () => import('./pages/records-viewer/records-viewer.page').then(m => m.RecordsViewerPage),
  },
  
  //* Ruta comodín (Catch-all)
  // Si el usuario escribe cualquier cosa errónea en la URL, lo redirigimos al formato por defecto
  {
    path: '**',
    redirectTo: 'records/2',
  },
];