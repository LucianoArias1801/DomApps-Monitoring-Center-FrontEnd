// ? ==========================================================================
// ? 1. CONTROLADOR DE ACCESO - DOMAPPS MONITORING CENTER
// ? ==========================================================================
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class LoginPage implements OnInit {

  //* Propiedades del componente
  loginForm!: FormGroup;

  constructor(private fb: FormBuilder) { }

  //* Inicialización del ciclo de vida
  ngOnInit() {
    // 1. Cargamos la estructura del formulario al entrar
    this.initLoginForm();
  }

  // ? ==========================================================================
  // ? 2. MÉTODOS DE FORMULARIO
  // ? ==========================================================================

  //* Configura las validaciones estrictas de los campos
  initLoginForm() {
    // 3. Definimos campos requeridos para evitar entradas nulas al backend
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });
  }

  //* Procesa el intento de inicio de sesión
  onLogin() {
    // 3. Verificamos que el formulario sea válido antes de disparar la lógica
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      
      console.log('Intentando conectar con Domapps Backend...', { email });
      
      // Aquí llamaremos al servicio que tu compañero desarrolle
    }
  }

}