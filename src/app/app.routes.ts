// ? ==========================================================================
// ? 1. CONFIGURACIÓN DEL ENRUTAMIENTO GLOBAL DINÁMICO - DOMAPPS
// ? ==========================================================================
import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from './services/auth/auth'; 

// 2. Guardián de seguridad (Verifica sesión activa y Roles)
const authGuard = (route: any, state: any) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const isAuth = auth.isAuthenticated();
  
  // Si no hay sesión activa, mandamos al login
  if (!isAuth) {
    router.navigate(['/login']); 
    return false;
  }

  // Obtenemos los datos del usuario conectado
  const user = auth.getUserData();
  const userRole = user?.role || '';

  // 🛡️ REGLA RBAC: Si es "Visualizador" y quiere entrar a "records", lo rebotamos al Hub
  if (userRole === 'Visualizador' && state.url.includes('/records')) {
    router.navigate(['/dashboards-hub'], { replaceUrl: true });
    return false;
  }

  // Si tiene sesión y su rol se lo permite, pasa
  return true; 
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

  //* ==========================================================================
  //* NUEVA RUTA: HUB DE TABLEROS (Protegida)
  //* ==========================================================================
  {
    path: 'dashboards-hub',
    canActivate: [authGuard], // Protegemos los tableros con el mismo guardián
    loadComponent: () => import('./pages/dashboards-hub/dashboards-hub.page').then(m => m.DashboardsHubPage)
  },
  
  //* Ruta comodín (Catch-all)
  // SIEMPRE DEBE IR AL FINAL. Si no encuentra ninguna de las de arriba, redirige aquí.
  {
    path: '**',
    redirectTo: 'records/2',
  }
];