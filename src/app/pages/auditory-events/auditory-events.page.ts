import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { addIcons } from 'ionicons';
import { 
  menuOutline, desktopOutline, clipboardOutline, logOutOutline, 
  addCircleOutline, funnelOutline, imageOutline, pencilOutline, listOutline 
} from 'ionicons/icons';

export interface AuditoryEvent {
  id: string;
  unidad: string; // Matrícula
  eco: string;
  agencia: string;
  objetosValor: string;
  vidriosAbajo: string;
  puertaAbierta: string; // Añadido por tu requerimiento
  interaccionOperador: string;
  tiempoEspera: string;
  fechaAuditoria: string;
  horaAuditoria: string;
  comentario?: string;
}

@Component({
  selector: 'app-auditory-events',
  templateUrl: './auditory-events.page.html',
  styleUrls: ['./auditory-events.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AuditoryEventsPage implements OnInit {

  public auditsList: AuditoryEvent[] = [];
  public selectedAudit: AuditoryEvent | null = null;
  public isLoading: boolean = false;

  constructor() { 
    addIcons({ 
      menuOutline, desktopOutline, clipboardOutline, logOutOutline,
      addCircleOutline, funnelOutline, imageOutline, pencilOutline, listOutline
    });
  }

  ngOnInit() {
    this.loadAudits();
  }

  // ? ==========================================================================
  // ? CARGA DE DATOS DE AUDITORÍA (MOCKS BASADOS EN EXCEL)
  // ? ==========================================================================
  
  public loadAudits() {
    this.isLoading = true;
    const localMocks: AuditoryEvent[] = [
      { id: 'AUD-001', unidad: 'PDY1429', eco: '4016', agencia: 'METRO CEYLAN', objetosValor: 'NO', vidriosAbajo: 'CERRADO', puertaAbierta: 'CERRADA', interaccionOperador: 'N/A', tiempoEspera: '1 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '12:35' },
      { id: 'AUD-002', unidad: 'KZ69329', eco: '2781', agencia: 'METRO COACALCO', objetosValor: 'MOCHILA PEQUEÑA', vidriosAbajo: 'CERRADO', puertaAbierta: 'CERRADA', interaccionOperador: 'N/A', tiempoEspera: '1 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '12:56', comentario: 'Mochila visible en asiento del copiloto.' },
      { id: 'AUD-003', unidad: 'WN57883', eco: '2878', agencia: 'METRO TLAHUAC', objetosValor: 'NO', vidriosAbajo: 'ABIERTO', puertaAbierta: 'ABIERTA', interaccionOperador: 'N/A', tiempoEspera: '1 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '12:59' },
      { id: 'AUD-004', unidad: 'TM3704G', eco: '4089', agencia: 'CENTRO SLP', objetosValor: 'MALETA', vidriosAbajo: 'ABIERTO', puertaAbierta: 'CERRADA', interaccionOperador: 'CONDUCIENDO', tiempoEspera: '1 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '13:02' },
      { id: 'AUD-005', unidad: 'EZ78054', eco: '2943', agencia: 'NORTE GOMEZ PALACIO', objetosValor: 'CELULAR', vidriosAbajo: 'ABIERTO', puertaAbierta: 'CERRADA', interaccionOperador: 'NOTIFICADO', tiempoEspera: '2 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '13:06' },
    ];

    setTimeout(() => {
      this.auditsList = localMocks;
      if (this.auditsList.length > 0) { this.selectedAudit = this.auditsList[0]; }
      this.isLoading = false;
    }, 500);
  }

  public onSelectAudit(audit: AuditoryEvent) {
    this.selectedAudit = audit;
  }

  // ? ==========================================================================
  // ? NAVEGACIÓN
  // ? ==========================================================================

  public navigateTo(module: string) {
    console.log(`Navegando hacia: ${module}`);
  }

  public logout() {
    console.log('Cerrando sesión del usuario...');
  }
}