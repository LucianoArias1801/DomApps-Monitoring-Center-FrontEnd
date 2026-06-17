import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Importamos tu servicio Auth actual
import { Auth } from './auth'; 

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inyectamos las dependencias necesarias directamente
  const authService = inject(Auth);
  const router = inject(Router);
  const toastController = inject(ToastController);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el servidor (Node.js) nos batea con un 401 Unauthorized
      if (error.status === 401) {
        console.warn('⚠️ Token vencido o inválido. Cerrando sesión por seguridad...');
        
        // 1. Limpiamos el rastro en el frontend usando tu método existente
        authService.logout();
        
        // 2. Redirigimos al usuario al login
        router.navigate(['/login'], { replaceUrl: true });
        
        // 3. Le avisamos amablemente qué pasó
        toastController.create({
          message: 'Tu sesión ha expirado por seguridad. Vuelve a ingresar.',
          duration: 4000,
          position: 'bottom',
          color: 'warning',
          buttons: [{ text: 'OK', role: 'cancel' }]
        }).then(toast => toast.present());
      }
      
      // Dejamos que el error siga su camino por si otro componente lo necesita
      return throwError(() => error);
    })
  );
};