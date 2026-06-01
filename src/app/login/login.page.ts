import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

// 1. Importamos la clase Auth (Ruta relativa correcta asumiendo src/app/pages/login)
import { Auth } from '../services/auth/auth'; 

import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, logInOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class LoginPage implements OnInit {

  loginForm!: FormGroup;
  public isLoading: boolean = false;
  public showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: Auth, // 2. Inyectamos la clase Auth aquí
    private toastController: ToastController
  ) {
    addIcons({ mailOutline, lockClosedOutline, logInOutline, eyeOutline, eyeOffOutline });
  }

  ngOnInit() {
    // Si ya tiene sesión activa, lo mandamos a la ruta maestra (Visor universal)
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/records/2'], { replaceUrl: true });
    }
    this.initLoginForm();
  }

  initLoginForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });
  }

  public togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value;
      
      this.auth.login({ email, password }).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          
          // 🎯 EL SECRETO: Forzamos el guardado inmediato en la página para ganarle al ciclo de vida
          if (response && response.token) {
            localStorage.setItem('domapps_token', response.token);
            localStorage.setItem('domapps_user', JSON.stringify(response.user));
          }
          
          console.log('🔑 [OK] Token inyectado con éxito. Intentando romper el AuthGuard...');

          // Ejecutamos la navegación con un salvavidas por si el enrutador se queda trabado
          this.router.navigate(['/records/2'], { replaceUrl: true })
            .then((navigated) => {
              if (navigated) {
                console.log('🏁 ¡Navegación completada con éxito!');
              } else {
                console.warn('⚠️ El Router rechazó la navegación blanda. Aplicando redirección forzada...');
                // Salvavidas definitivo si el árbol de rutas de Angular se quedó bloqueado en caché
                window.location.href = '/records/2';
              }
            })
            .catch((routingError) => {
              console.error('❌ Error en el Router de Angular. Aplicando bypass:', routingError);
              window.location.href = '/records/2';
            });
        },
        error: (err: any) => {
          console.error('Error al iniciar sesión:', err);
          this.isLoading = false;
          this.presentErrorToast(err.error?.message || 'Correo o contraseña incorrectos.');
        }
      });
    }
  }

  private async presentErrorToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }
}