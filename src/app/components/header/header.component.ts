import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router'; 
import { Auth } from '../../services/auth/auth'; 

// 1. Importamos el nuevo servicio universal y la interfaz
import { DynamicFormsService } from '../../services/dynamic-forms/dynamic-forms';
import { FormTemplate } from '../../models/dynamic-forms.model';

import { addIcons } from 'ionicons';
import { menuOutline, desktopOutline, clipboardOutline, logOutOutline, documentTextOutline } from 'ionicons/icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HeaderComponent implements OnInit {

  public username: string = 'Usuario';
  
  // 2. Arreglo para almacenar los formularios que lleguen de la base de datos
  public formTemplates: FormTemplate[] = [];

  constructor(
    private router: Router, 
    private auth: Auth,
    private dynamicFormsService: DynamicFormsService // <-- Inyectamos el nuevo servicio
  ) {
    addIcons({ menuOutline, desktopOutline, clipboardOutline, logOutOutline, documentTextOutline });
    
    const userData = this.auth.getUserData();
    if (userData && userData.username) {
      this.username = userData.username;
    }
  }

  // 3. Al iniciar el componente, consultamos las plantillas activas
  ngOnInit() {
    this.loadMenuOptions();
  }

  private loadMenuOptions() {
    this.dynamicFormsService.getTemplates().subscribe({
      // 1. Cambialo a FormTemplate[] (Recuerda importar FormTemplate arriba)
      next: (templates: FormTemplate[]) => { 
        this.formTemplates = templates;
        console.log('✅ Menú dinámico cargado con las plantillas:', this.formTemplates);
      },
      // 2. Este déjalo como 'any', es totalmente correcto
      error: (err: any) => { 
        console.error('❌ Error al cargar las opciones del menú:', err);
      }
    });
  }

  /**
   * 4. Nuevo método de navegación universal.
   * Recibe el ID de la plantilla y navega a la ruta dinámica (Ej: /records/2)
   */
  public navigateToRecords(templateId: number) {
    console.log(`Navegando hacia el visualizador con el template ID: ${templateId}`);
    this.router.navigate(['/records', templateId]); 
  }

  public logout() {
    console.log('🔴 Cerrando sesión de forma segura...');
    this.auth.logout(); // <-- Delegamos la limpieza al servicio Auth para mantener buenas prácticas
    this.router.navigate(['/login']); // <-- Navegación SPA fluida sin recargar toda la página (window.location)
  }
}