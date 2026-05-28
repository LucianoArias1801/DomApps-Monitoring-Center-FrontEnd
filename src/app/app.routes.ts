// ? ==========================================================================
// ? 1. CONFIGURACIÓN DEL ENRUTAMIENTO GLOBAL - DOMAPPS
// ? ==========================================================================
import { Routes } from '@angular/router';

export const routes: Routes = [
  //* Redirección Inicial
  {
    path: '',
    // 3. Si la URL de la app está vacía (inicio), redirige de inmediato al login
    redirectTo: 'login',
    pathMatch: 'full',
  },
  
  //* Ruta de la pantalla de Login
  {
    path: 'login',
    // 3. Usamos loadComponent para cargar la página de forma diferida (Lazy Loading)
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'monitoring-events',
    loadComponent: () => import('./pages/monitoring-events/monitoring-events.page').then(m => m.MonitoringEventsPage),
  },
  {
    path: 'auditory-events',
    loadComponent: () => import('./pages/auditory-events/auditory-events.page').then( m => m.AuditoryEventsPage)
  },
];