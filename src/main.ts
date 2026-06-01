import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'; // Puedes quitar el HTTP_INTERCEPTORS si quieres

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

// import { AuthInterceptor } from './app/interceptors/auth.interceptor'; // 👈 Comenta esto

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptorsFromDi()),
    
    // 💀 APAGA ESTA LÍNEA (Bórrala o ponle // al inicio)
    // { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
}).catch((err) => console.error(err));