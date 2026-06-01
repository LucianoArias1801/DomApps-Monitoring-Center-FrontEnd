import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

// IMPORTAMOS TU SERVICIO
import { Auth } from '../../services/auth/auth'; 

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private auth: Auth,
    private router: Router,
    private toastController: ToastController
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    
    // 🛡️ FILTRO 1: Si la petición NO va a tu backend local (/api), déjala pasar libremente.
    // Esto evita que errores 401 de servidores externos (mapas, plugins) te cierren la sesión.
    if (!request.url.includes('/api')) {
      return next.handle(request);
    }

    // 🛡️ FILTRO 2: Si va al endpoint de login público, ignoramos el flujo del token.
    if (request.url.includes('/login')) {
      return next.handle(request);
    }

    // 1. Obtenemos el token guardado
    const token = this.auth.getToken(); 
    let authReq = request;
    
    // 2. Si hay sesión activa, inyectamos las credenciales de seguridad
    if (token) {
      // 💡 NOTA: Si tu servidor no acepta la palabra 'Bearer', 
      // cambia la línea de abajo por: SetHeaders: { Authorization: `${token}` }
      // 🚀 CAMBIO EN AUTH.INTERCEPTOR.TS SI TU BACKEND NO USA BEARER:
authReq = request.clone({
  setHeaders: { Authorization: `${token}` } // 👈 Quitamos la palabra 'Bearer '
});
    }

    // 3. Enviamos la petición modificada al backend
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        
        if (error.status === 401) {
          // 🚨 IMPRIMIMOS EL ERROR REAL PERO NO BORRAMOS EL TOKEN
          console.error(`🚨 [EL CULPABLE] El backend rechazó el token en esta URL: ${request.url}`);
          console.error(`Mensaje del backend:`, error.message);
          
          // 🛑 COMENTAMOS ESTAS LÍNEAS PARA QUE NO TE EXPULSE:
          // this.auth.logout(); 
          // this.presentToast('Tu sesión ha expirado...', 'warning');
          // this.router.navigate(['/login'], { replaceUrl: true });
        }

        return throwError(() => error);
      })
    );
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}