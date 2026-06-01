// ? ==========================================================================
// ? 1. CONTROLADOR DE AUDITORÍAS EN CABINA - DOMAPPS
// ? ==========================================================================
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { addIcons } from 'ionicons';
import { 
  menuOutline, funnelOutline, imageOutline, pencilOutline, 
  addCircleOutline, listOutline, desktopOutline, clipboardOutline, 
  logOutOutline, closeCircle, cloudUploadOutline, chevronDownOutline,
  trashOutline, videocamOutline, calendarOutline, downloadOutline
} from 'ionicons/icons';

// Interfaz para la tabla principal (Basada en tu Excel)
export interface AuditoryEvent {
  id: string;
  unidad: string;
  eco: string;
  agencia: string;
  objetosValor: string;
  vidriosAbajo: string;
  interaccionOperador: string;
  tiempoEspera: string;
  fechaAuditoria: string;
  horaAuditoria: string;
  comentario?: string;
}

// Interfaz para el catálogo de unidades
export interface UnitReference {
  eco: string;
  unidad: string; // Matrícula
  agencia: string;
  region: string;
}

@Component({
  selector: 'app-auditory-events',
  templateUrl: './auditory-events.page.html',
  styleUrls: ['./auditory-events.page.scss'], // <--- Asegura que la referencia es correcta (si usas scss)
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class AuditoryEventsPage implements OnInit {

  @ViewChild('newAuditModal') newAuditModal: any; 

  //* Estados de la vista
  public auditsList: AuditoryEvent[] = [];
  public selectedAudit: AuditoryEvent | null = null;
  public isLoading: boolean = false;

  //* Variables para controlar la apertura de los menús desplegables manuales (Nueva Auditoría)
  public isEcoDropdownOpen: boolean = false;
  public isObjetosDropdownOpen: boolean = false;
  public isVidriosDropdownOpen: boolean = false;
  public isInteraccionDropdownOpen: boolean = false;
  public isTiempoDropdownOpen: boolean = false;

  //* VARIABLES PARA MODALES DE FECHA
  public isStartDateModalOpen: boolean = false;
  public isEndDateModalOpen: boolean = false;

  //* VARIABLES PARA LA EVIDENCIA MULTIMEDIA
  public selectedEvidence: File | null = null;
  public evidenceIcon: string = 'image-outline';

  //* Variable para filtros de busqueda
  @ViewChild('filterModal') filterModal: any;

  public filterForm = {
    fechaInicio: '',
    fechaFin: '',
    unidadBusqueda: '', // Input text libre
    agencia: '',
    objetosValor: '',
    vidriosAbajo: ''
  };

  //* Controladores de los dropdowns del filtro
  public isFilterAgenciaOpen: boolean = false;
  public isFilterObjetosOpen: boolean = false;
  public isFilterVidriosOpen: boolean = false;

  //* Variables para el formulario de edicion de eventos
  @ViewChild('editAuditModal') editAuditModal: any;

  public editAuditForm = {
    eco: '', unidad: '', agencia: '',
    objetosValor: '', vidriosAbajo: '', interaccionOperador: '', tiempoEspera: '',
    fechaHoraAuditoria: '', comentario: ''
  };

  public isEditEcoDropdownOpen: boolean = false;
  public isEditObjetosDropdownOpen: boolean = false;
  public isEditVidriosDropdownOpen: boolean = false;
  public isEditInteraccionDropdownOpen: boolean = false;
  public isEditTiempoDropdownOpen: boolean = false;

  // ? ==========================================================================
  // ? BASE DE DATOS MOCK Y VARIABLES DE BUSCADOR
  // ? ==========================================================================
  
  public unitsCatalog: UnitReference[] = [
    { eco: '4016', agencia: 'METRO CEYLAN', unidad: 'PDY1429', region: 'Norte' },
    { eco: '2781', agencia: 'METRO COACALCO', unidad: 'KZ69329', region: 'Centro' },
    { eco: '2878', agencia: 'METRO TLAHUAC', unidad: 'WN57883', region: 'Centro' },
    { eco: '3572', agencia: 'CENTRO COLIMA', unidad: 'JW25749', region: 'Centro' },
    { eco: '4089', agencia: 'CENTRO SLP', unidad: 'TM3704G', region: 'Centro' },
    { eco: '2943', agencia: 'NORTE GOMEZ PALACIO', unidad: 'EZ78054', region: 'Norte' },
    { eco: '2643', agencia: 'NORTE CD JUAREZ', unidad: 'ED65731', region: 'Norte' },
    { eco: '2586', agencia: 'NORTE MEXICALI', unidad: 'AN33534', region: 'Norte' },
    { eco: '2441', agencia: 'SUR PACHUCA', unidad: 'KY54957', region: 'Sur' },
    { eco: '3769', agencia: 'SUR PUEBLA', unidad: 'NA2', region: 'Sur' }
  ];

  // Variables para el buscador dinámico del Popover (ECO)
  public ecoSearchQuery: string = '';
  public filteredEcos: UnitReference[] = [];

  // Mocks para Auditorías (Basados en Excel)
  public agenciasMock = ['METRO CEYLAN', 'METRO COACALCO', 'METRO TLAHUAC', 'CENTRO COLIMA', 'CENTRO SLP', 'NORTE GOMEZ PALACIO', 'NORTE CD JUAREZ', 'NORTE MEXICALI', 'SUR PACHUCA', 'SUR PUEBLA'];
  public objetosMock = ['NO', 'MOCHILA PEQUEÑA', 'MOCHILA', 'MALETA', 'CELULAR', 'CELULARES'];
  public vidriosMock = ['CERRADO', 'ABIERTO'];
  public interaccionMock = ['N/A', 'CONDUCIENDO', 'NOTIFICADO', 'NOTIFICADOS'];
  public tiempoMock = ['1 MIN', '2 MIN'];

  public newAuditForm = {
    unidad: '',
    eco: '',
    agencia: '',
    objetosValor: '',
    vidriosAbajo: '',
    interaccionOperador: '',
    tiempoEspera: '',
    fechaHoraAuditoria: '',
    comentario: ''
  };

  constructor() { 
    addIcons({ 
      menuOutline, funnelOutline, imageOutline, pencilOutline, 
      addCircleOutline, listOutline, desktopOutline, clipboardOutline, 
      logOutOutline, closeCircle, cloudUploadOutline, chevronDownOutline,
      trashOutline, videocamOutline , downloadOutline
    });
  }

  // Variable para almacenar el tope máximo global (Hoy)
  public todayDate: string = '';

  ngOnInit() {
    this.loadAudits();
    this.filteredEcos = [...this.unitsCatalog];
    
    // Calculamos la fecha actual en formato universal ISO (YYYY-MM-DD)
    const currentSystemDate = new Date();
    const year = currentSystemDate.getFullYear();
    const month = String(currentSystemDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentSystemDate.getDate()).padStart(2, '0');
    this.todayDate = `${year}-${month}-${day}`;

    // Carga inicial del tiempo de ocurrencia por defecto
    this.newAuditForm.fechaHoraAuditoria = this.getMexicoCSTMinus2Minutes();
  }

  // ? ==========================================================================
  // ? CÁLCULO DE TIEMPO DE SUCESO AUTODETECTADO
  // ? ==========================================================================
  public getMexicoCSTMinus2Minutes(): string {
    const now = new Date();
    // Forzamos conversión limpia a UTC y aplicamos el desfase fijo de México CST (UTC-6)
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const cstOffset = -6; 
    const cstDate = new Date(utcTime + (3600000 * cstOffset));
    
    // Restamos exactamente 2 minutos al reloj
    cstDate.setMinutes(cstDate.getMinutes() - 2);
    
    // Construcción semántica del formato solicitado
    const day = String(cstDate.getDate()).padStart(2, '0');
    const month = String(cstDate.getMonth() + 1).padStart(2, '0');
    const year = cstDate.getFullYear();
    
    let hours = cstDate.getHours();
    const minutes = String(cstDate.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // El formato '0' horas se transforma en '12'
    const strHours = String(hours).padStart(2, '0');
    
    return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm} (CST)`;
  }

  // ? ==========================================================================
  // ? LÓGICA PRINCIPAL DE LA VISTA
  // ? ==========================================================================

  public loadAudits() {
    this.isLoading = true;
    const localMocks: AuditoryEvent[] = [
      { id: 'AUD-001', unidad: 'PDY1429', eco: '4016', agencia: 'METRO CEYLAN', objetosValor: 'NO', vidriosAbajo: 'CERRADO', interaccionOperador: 'N/A', tiempoEspera: '1 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '12:35' },
      { id: 'AUD-002', unidad: 'KZ69329', eco: '2781', agencia: 'METRO COACALCO', objetosValor: 'MOCHILA PEQUEÑA', vidriosAbajo: 'CERRADO', interaccionOperador: 'N/A', tiempoEspera: '1 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '12:56', comentario: 'Mochila en asiento copiloto.' },
      { id: 'AUD-003', unidad: 'WN57883', eco: '2878', agencia: 'METRO TLAHUAC', objetosValor: 'NO', vidriosAbajo: 'ABIERTO', interaccionOperador: 'N/A', tiempoEspera: '1 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '12:59' },
      { id: 'AUD-004', unidad: 'JW25749', eco: '3572', agencia: 'CENTRO COLIMA', objetosValor: 'MOCHILA', vidriosAbajo: 'CERRADO', interaccionOperador: 'N/A', tiempoEspera: '1 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '13:00' },
      { id: 'AUD-005', unidad: 'TM3704G', eco: '4089', agencia: 'CENTRO SLP', objetosValor: 'MALETA', vidriosAbajo: 'ABIERTO', interaccionOperador: 'CONDUCIENDO', tiempoEspera: '1 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '13:02' },
      { id: 'AUD-006', unidad: 'EZ78054', eco: '2943', agencia: 'NORTE GOMEZ PALACIO', objetosValor: 'CELULAR', vidriosAbajo: 'ABIERTO', interaccionOperador: 'NOTIFICADO', tiempoEspera: '2 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '13:06' },
      { id: 'AUD-007', unidad: 'ED65731', eco: '2643', agencia: 'NORTE CD JUAREZ', objetosValor: 'CELULARES', vidriosAbajo: 'ABIERTO', interaccionOperador: 'NOTIFICADOS', tiempoEspera: '2 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '13:15' },
      { id: 'AUD-008', unidad: 'AN33534', eco: '2586', agencia: 'NORTE MEXICALI', objetosValor: 'NO', vidriosAbajo: 'ABIERTO', interaccionOperador: 'CONDUCIENDO', tiempoEspera: '1 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '13:18' },
      { id: 'AUD-009', unidad: 'KY54957', eco: '2441', agencia: 'SUR PACHUCA', objetosValor: 'NO', vidriosAbajo: 'ABIERTO', interaccionOperador: 'N/A', tiempoEspera: '1 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '13:20' },
      { id: 'AUD-010', unidad: 'NA2', eco: '3769', agencia: 'SUR PUEBLA', objetosValor: 'NO', vidriosAbajo: 'CERRADO', interaccionOperador: 'N/A', tiempoEspera: '1 MIN', fechaAuditoria: '17.04.2026', horaAuditoria: '13:22' }
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
  // ? LÓGICA DEL MODAL, BUSCADOR Y AUTO-LLENADO
  // ? ==========================================================================

  //* Filtra la lista de unidades buscando coincidencias en todos sus datos
  public filterEcos() {
    const query = this.ecoSearchQuery.toLowerCase();
    this.filteredEcos = this.unitsCatalog.filter(u => {
      const cadenaCompleta = `${u.unidad}- ${u.eco} ${u.agencia}`.toLowerCase();
      return cadenaCompleta.includes(query);
    });
  }

  //* Se ejecuta al hacer clic en un ECO del menú desplegable 
  public selectEco(unit: UnitReference) {
    this.newAuditForm.eco = unit.eco;
    this.newAuditForm.agencia = unit.agencia;
    this.newAuditForm.unidad = unit.unidad;

    // Reseteamos el buscador y CERRAMOS el menú
    this.ecoSearchQuery = '';
    this.filteredEcos = [...this.unitsCatalog];
    this.isEcoDropdownOpen = false;
  }

  public selectObjetos(objeto: string) {
    this.newAuditForm.objetosValor = objeto;
    this.isObjetosDropdownOpen = false;
  }

  public selectVidrios(vidrio: string) {
    this.newAuditForm.vidriosAbajo = vidrio;
    this.isVidriosDropdownOpen = false;
  }

  public selectInteraccion(interaccion: string) {
    this.newAuditForm.interaccionOperador = interaccion;
    this.isInteraccionDropdownOpen = false;
  }

  public selectTiempo(tiempo: string) {
    this.newAuditForm.tiempoEspera = tiempo;
    this.isTiempoDropdownOpen = false;
  }

  public submitAudit() {
    this.isLoading = true;
    
    setTimeout(() => {
      console.log('Auditoría subida con éxito:', this.newAuditForm);
      this.isLoading = false;
      this.newAuditModal.dismiss(); 
    }, 800);
  }

  //* FUNCIÓN MAESTRA DE RESETEO (Se ejecuta automáticamente al cerrar el modal)
  public resetForm() {
    console.log('Limpiando datos del modal por cierre de ciclo de vida...');

    // 1. Reiniciar el formulario a valores vacíos e inyectar nueva hora base
    this.newAuditForm = {
      unidad: '', eco: '', agencia: '', objetosValor: '', 
      vidriosAbajo: '', interaccionOperador: '', tiempoEspera: '', 
      fechaHoraAuditoria: this.getMexicoCSTMinus2Minutes(), 
      comentario: ''
    };

    // 2. Destruir la evidencia multimedia cargada
    this.selectedEvidence = null;
    this.evidenceIcon = 'image-outline';

    // 3. Forzar el cierre de todos los dropdowns personalizados
    this.isEcoDropdownOpen = false;
    this.isObjetosDropdownOpen = false;
    this.isVidriosDropdownOpen = false;
    this.isInteraccionDropdownOpen = false;
    this.isTiempoDropdownOpen = false;

    // 4. Limpiar el cajón del buscador de unidades
    this.ecoSearchQuery = '';
    this.filteredEcos = [...this.unitsCatalog];
  }

  // ? ==========================================================================
  // ? MENÚ DESPLEGABLE Y NAVEGACIÓN
  // ? ==========================================================================

  public navigateTo(module: string) {
    console.log(`Navegando hacia: ${module}`);
  }

  public logout() {
    console.log('Cerrando sesión del usuario...');
  }

  //* ==========================================================================
  //* LÓGICA PARA CARGA DE EVIDENCIA
  //* ==========================================================================

  public onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedEvidence = file;
      
      // Asignamos el icono dependiendo de si es video o imagen
      if (file.type.startsWith('video/')) {
        this.evidenceIcon = 'videocam-outline';
      } else {
        this.evidenceIcon = 'image-outline';
      }
    }
  }

  public removeEvidence() {
    this.selectedEvidence = null;
  }

  public formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  //* ==========================================================================
  //* LÓGICA DEL FILTRO
  //* ==========================================================================

  public applyFilters() {
    this.isLoading = true;
    setTimeout(() => {
      console.log('Filtros aplicados:', this.filterForm);
      this.isLoading = false;
      this.filterModal.dismiss();
    }, 600);
  }

  public clearFilters() {
    this.filterForm = {
      fechaInicio: '', fechaFin: '', unidadBusqueda: '',
      agencia: '', objetosValor: '', vidriosAbajo: ''
    };
  }

  public closeFilterDropdowns() {
    this.isFilterAgenciaOpen = false;
    this.isFilterObjetosOpen = false;
    this.isFilterVidriosOpen = false;
  }

  public openFilters() {
    if (this.filterModal) {
      this.filterModal.present();
    } else {
      console.error('No se encontró la referencia #filterModal en el HTML');
    }
  }

  //* ==========================================================================
  //* LÓGICA DE CALENDARIOS (ION-DATETIME)
  //* ==========================================================================

  public formatDateForUI(dateString: string): string {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  public onStartDateChanged(event: any) {
    if (!event || !event.detail || !event.detail.value) return;
    const rawValue = event.detail.value;
    this.filterForm.fechaInicio = rawValue.split('T')[0]; 
    this.isStartDateModalOpen = false; 
  }

  public onEndDateChanged(event: any) {
    if (!event || !event.detail || !event.detail.value) return;
    const rawValue = event.detail.value;
    this.filterForm.fechaFin = rawValue.split('T')[0]; 
    this.isEndDateModalOpen = false;
  }

  get maxFechaInicio() { return this.filterForm.fechaFin ? this.filterForm.fechaFin : this.todayDate; }
  get minFechaFin() { return this.filterForm.fechaInicio ? this.filterForm.fechaInicio : '2000-01-01'; }
  get maxFechaFin() { return this.todayDate; }

  // * ==========================================================================
  // * EXPORTACIÓN DE DATOS
  // * ==========================================================================
  
  public downloadCSV() {
    console.log('Iniciando descarga de bitácora en formato CSV...');
  }

  // * ==========================================================================
  // * VARIABLES PARA EL MODAL DE EDICIÓN
  // * ==========================================================================

  public openEditModal() {
    if (!this.selectedAudit) return;

    // Clonamos los datos actuales de la fila seleccionada hacia el formulario de edición
    this.editAuditForm = {
      eco: this.selectedAudit.eco || '',
      unidad: this.selectedAudit.unidad || '',
      agencia: this.selectedAudit.agencia || '',
      objetosValor: this.selectedAudit.objetosValor || '',
      vidriosAbajo: this.selectedAudit.vidriosAbajo || '',
      interaccionOperador: this.selectedAudit.interaccionOperador || '',
      tiempoEspera: this.selectedAudit.tiempoEspera || '',
      fechaHoraAuditoria: `${this.selectedAudit.fechaAuditoria} ${this.selectedAudit.horaAuditoria}` || '',
      comentario: this.selectedAudit.comentario || ''
    };

    this.editAuditModal.present();
  }

  public updateAudit() {
    this.isLoading = true;
    setTimeout(() => {
      console.log('Auditoría modificada y guardada:', this.editAuditForm);
      this.isLoading = false;
      this.editAuditModal.dismiss();
    }, 800);
  }

  public resetEditForm() {
    this.isEditEcoDropdownOpen = false;
    this.isEditObjetosDropdownOpen = false;
    this.isEditVidriosDropdownOpen = false;
    this.isEditInteraccionDropdownOpen = false;
    this.isEditTiempoDropdownOpen = false;
  }

  public selectEditEco(unit: UnitReference) {
    this.editAuditForm.eco = unit.eco;
    this.editAuditForm.unidad = unit.unidad;
    this.editAuditForm.agencia = unit.agencia;

    this.ecoSearchQuery = '';
    this.filteredEcos = [...this.unitsCatalog];
    this.isEditEcoDropdownOpen = false;
  }
}