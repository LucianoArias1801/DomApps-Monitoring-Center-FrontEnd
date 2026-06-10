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
          
          console.log('🔑 [OK] Login exitoso, redirigiendo...');

          this.router.navigate(['/records/2'], { replaceUrl: true });
        },
        error: (err: any) => {
          this.isLoading = false;
          
          let message = 'Error de conexión. Intenta más tarde.';
          
          if (err.status === 401) {
            message = 'Correo o contraseña incorrectos.';
          } else if (err.status === 0) {
            message = 'No se pudo conectar al servidor. Verifica tu conexión.';
          } else if (err.status === 404) {
            message = 'Servicio de login no disponible. Contacta al administrador.';
          } else if (err.status === 500) {
            message = 'Error interno del servidor. Intenta más tarde.';
          } else if (err.error?.message) {
            message = err.error.message;
          }
          console.error('Error al iniciar sesión:', err);
          this.presentErrorToast(message);
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