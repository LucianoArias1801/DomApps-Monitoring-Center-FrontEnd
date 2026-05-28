// ? ==========================================================================
// ? 1. CONTROLADOR DE MONITOREO DE EVENTOS - DOMAPPS
// ? ==========================================================================
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { addIcons } from 'ionicons';
import { 
  menuOutline, funnelOutline, imageOutline, pencilOutline, 
  addCircleOutline, listOutline, desktopOutline, clipboardOutline, 
  logOutOutline, closeCircle, cloudUploadOutline, chevronDownOutline,
  trashOutline, videocamOutline, calendarOutline, downloadOutline
} from 'ionicons/icons';

import { MonitoringService } from '../../services/monitoring/monitoring';

export interface FleetEvent {
  id: string;
  proveedor: string;
  conceptoUnidad: string;
  statusMix: string;
  tipoAlerta: string;
  status: string;
  fecha: string;
  plataforma: string;
  region: string;
  agencia: string;
  eco: string;
  matricula: string;
  posicion: string;
  cantidad: number;
  comentario: string;
}

export interface UnitReference {
  eco: string;
  region: string;
  agencia: string;
  matricula: string;
  posicion: string;
  vehiculo: string;
}

@Component({
  selector: 'app-monitoring-events',
  templateUrl: './monitoring-events.page.html',
  styleUrls: ['./monitoring-events.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MonitoringEventsPage implements OnInit {

  @ViewChild('newEventModal') newEventModal: any; 

  //* Estados de la vista
  public eventsList: FleetEvent[] = [];
  public selectedEvent: FleetEvent | null = null;
  public isLoading: boolean = false;

  //* Variables para controlar la apertura de los menús desplegables manuales
  public isEcoDropdownOpen: boolean = false;
  public isPlataformaDropdownOpen: boolean = false;
  public isEventoDropdownOpen: boolean = false;
  public isEstadoEventoDropdownOpen: boolean = false;
  public isEstadoReporteDropdownOpen: boolean = false;

  //* VARIABLES PARA MODALES DE FECHA
  public isStartDateModalOpen: boolean = false;
  public isEndDateModalOpen: boolean = false;

  //* VARIABLES PARA LA EVIDENCIA MULTIMEDIA
  public selectedEvidence: File | null = null;
  public evidenceIcon: string = 'image-outline';

  //* Variable para filtros de busqueda
  @ViewChild('filterModal') filterModal: any;

  public regionesMock = ['Norte', 'Centro', 'Sur', 'Occidente'];
  public agenciasMock = ['Hermosillo', 'Guadalajara', 'Mérida', 'Monterrey', 'CDMX'];

  public filterForm = {
    fechaInicio: '',
    fechaFin: '',
    unidadBusqueda: '', // Input text libre
    region: '',
    agencia: '',
    evento: '',
    estadoEvento: '',
    estadoReporte: ''
  };

  //* Controladores de los dropdowns del filtro
  public isFilterRegionOpen: boolean = false;
  public isFilterAgenciaOpen: boolean = false;
  public isFilterEventoOpen: boolean = false;
  public isFilterEstadoEventoOpen: boolean = false;
  public isFilterEstadoReporteOpen: boolean = false;

  //* Variables para el formulario de edicion de eventos
  @ViewChild('editEventModal') editEventModal: any;

  public editEventForm = {
    eco: '', region: '', agencia: '', matricula: '', posicion: '', vehiculo: '',
    plataforma: '', evento: '', estadoEvento: '', estadoReporte: '',
    fechaHoraOcurrencia: '', comentario: ''
  };

  public isEditEcoDropdownOpen: boolean = false;
  public isEditPlataformaDropdownOpen: boolean = false;
  public isEditEventoDropdownOpen: boolean = false;
  public isEditEstadoEventoDropdownOpen: boolean = false;
  public isEditEstadoReporteDropdownOpen: boolean = false;

  // ? ==========================================================================
  // ? BASE DE DATOS MOCK Y VARIABLES DE BUSCADOR
  // ? ==========================================================================
  
  public unitsCatalog: UnitReference[] = [
    { eco: '3332', region: 'Norte', agencia: 'Hermosillo', matricula: 'VD95893', posicion: 'Reparto', vehiculo: 'ISUZU ELF 400' },
    { eco: '3807', region: 'Centro', agencia: 'Guadalajara', matricula: 'JW49604', posicion: 'Furia Roja', vehiculo: 'VW SAVEIRO' },
    { eco: '4501', region: 'Sur', agencia: 'Mérida', matricula: 'YV2210', posicion: 'Ejecutivo', vehiculo: 'NISSAN NP300' }
  ];

  // 3. Variables para el buscador dinámico del Popover (ECO)
  public ecoSearchQuery: string = '';
  public filteredEcos: UnitReference[] = [];

  public plataformasMock = ['Traffilog', 'PF', 'Geotab', 'Manual'];
  public eventosMock = ['CIERRE DE OJOS', 'CINTURON', 'EXCESO VELOCIDAD', 'FRENADO BRUSCO'];
  public estadosEventoMock = ['Falso', 'Verdadero', 'Sin Video', 'Duda'];
  public estadosReporteMock = ['Reportado', 'No Reportado'];

  public newEventForm = {
    eco: '',
    region: '',
    agencia: '',
    matricula: '',
    posicion: '',
    vehiculo: '',
    plataforma: '',
    evento: '',
    estadoEvento: '',
    estadoReporte: '',
    fechaHoraOcurrencia: '',
    comentario: ''
  };

  constructor(private monitoringService: MonitoringService) { 
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
    this.loadEvents();
    this.filteredEcos = [...this.unitsCatalog];
    
    // Calculamos la fecha actual en formato universal ISO (YYYY-MM-DD)
    const currentSystemDate = new Date();
    const year = currentSystemDate.getFullYear();
    const month = String(currentSystemDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentSystemDate.getDate()).padStart(2, '0');
    this.todayDate = `${year}-${month}-${day}`;

    // Carga inicial del tiempo de ocurrencia por defecto
    this.newEventForm.fechaHoraOcurrencia = this.getMexicoCSTMinus2Minutes();
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

  public loadEvents() {
    this.isLoading = true;
    const localMocks: FleetEvent[] = [
      {
        id: 'EV-1001', proveedor: 'Traffilog', conceptoUnidad: 'VD95893- 3332 Norte Hermosillo ISUZU ELF 400',
        statusMix: 'ACCIONADO', tipoAlerta: 'CIERRE DE OJOS', status: 'WH', fecha: '01/05/2026 01:25 PM',
        plataforma: 'Traffilog', region: 'Norte', agencia: 'Hermosillo', eco: '3332',
        matricula: 'VD95893', posicion: 'Lat: 29.08, Lng: -110.95', cantidad: 1, comentario: 'Operador presenta fatiga'
      },
      {
        id: 'EV-1002', proveedor: 'PF', conceptoUnidad: 'JW49604- 3807 Centro Guadalajara VOLKSWAGEN SAVEIRO',
        statusMix: 'ACCIONADO', tipoAlerta: 'CINTURON', status: 'AF', fecha: '01/05/2026 02:39 PM',
        plataforma: 'PF', region: 'Centro', agencia: 'Guadalajara', eco: '3807',
        matricula: 'JW49604', posicion: 'Lat: 20.65, Lng: -103.34', cantidad: 3, comentario: 'Operador detenido sin cinturón'
      }
    ];

    setTimeout(() => {
      this.eventsList = localMocks;
      if (this.eventsList.length > 0) { this.selectedEvent = this.eventsList[0]; }
      this.isLoading = false;
    }, 500);
  }

  public onSelectEvent(event: FleetEvent) {
    this.selectedEvent = event;
  }

  // ? ==========================================================================
  // ? LÓGICA DEL MODAL, BUSCADOR Y AUTO-LLENADO
  // ? ==========================================================================

  //* Filtra la lista de unidades buscando coincidencias en todos sus datos
  public filterEcos() {
    const query = this.ecoSearchQuery.toLowerCase();
    this.filteredEcos = this.unitsCatalog.filter(u => {
      const cadenaCompleta = `${u.matricula}- ${u.eco} ${u.region} ${u.agencia} ${u.vehiculo}`.toLowerCase();
      return cadenaCompleta.includes(query);
    });
  }

  //* Se ejecuta al hacer clic en un ECO del menú desplegable (Reemplaza al ionChange anterior)
  public selectEco(unit: UnitReference) {
    this.newEventForm.eco = unit.eco;
    this.newEventForm.region = unit.region;
    this.newEventForm.agencia = unit.agencia;
    this.newEventForm.matricula = unit.matricula;
    this.newEventForm.posicion = unit.posicion;
    this.newEventForm.vehiculo = unit.vehiculo;

    // Reseteamos el buscador y CERRAMOS el menú
    this.ecoSearchQuery = '';
    this.filteredEcos = [...this.unitsCatalog];
    this.isEcoDropdownOpen = false; // <-- Nueva línea
  }

  public selectPlataforma(plataforma: string) {
    this.newEventForm.plataforma = plataforma;
    this.isPlataformaDropdownOpen = false;
  }

  public selectEvento(evento: string) {
    this.newEventForm.evento = evento;
    this.isEventoDropdownOpen = false;
  }

  public selectEstadoEvento(estado: string) {
    this.newEventForm.estadoEvento = estado;
    this.isEstadoEventoDropdownOpen = false;
  }

  public selectEstadoReporte(estado: string) {
    this.newEventForm.estadoReporte = estado;
    this.isEstadoReporteDropdownOpen = false;
  }

  public submitEvent() {
    this.isLoading = true;
    
    setTimeout(() => {
      console.log('Evento subido con éxito:', this.newEventForm);
      this.isLoading = false;
      
      // Al hacer dismiss, se disparará automáticamente el evento (ionModalDidDismiss) del HTML
      this.newEventModal.dismiss(); 
    }, 800);
  }

  //* 3. FUNCIÓN MAESTRA DE RESETEO (Se ejecuta automáticamente al cerrar el modal)
  public resetForm() {
    console.log('Limpiando datos del modal por cierre de ciclo de vida...');

    // 1. Reiniciar el formulario a valores vacíos e inyectar nueva hora base
    this.newEventForm = {
      eco: '', region: '', agencia: '', matricula: '', 
      posicion: '', vehiculo: '', plataforma: '', 
      evento: '', estadoEvento: '', estadoReporte: '',
      fechaHoraOcurrencia: this.getMexicoCSTMinus2Minutes(), // <-- Recalcula al cerrar/abrir
      comentario: ''
    };

    // 2. Destruir la evidencia multimedia cargada
    this.selectedEvidence = null;
    this.evidenceIcon = 'image-outline';

    // 3. Forzar el cierre de todos los dropdowns personalizados
    this.isEcoDropdownOpen = false;
    this.isPlataformaDropdownOpen = false;
    this.isEventoDropdownOpen = false;
    this.isEstadoEventoDropdownOpen = false;
    this.isEstadoReporteDropdownOpen = false;

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

  // Utilidad matemática para mostrar el peso del archivo de forma amigable (MB, KB)
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
      // Aquí llamarías a tu servicio para traer la data filtrada
    }, 600);
  }

  public clearFilters() {
    this.filterForm = {
      fechaInicio: '', fechaFin: '', unidadBusqueda: '',
      region: '', agencia: '', evento: '', estadoEvento: '', estadoReporte: ''
    };
  }

  public closeFilterDropdowns() {
    // Solo cerramos las listas flotantes por seguridad al cerrar el modal
    this.isFilterRegionOpen = false;
    this.isFilterAgenciaOpen = false;
    this.isFilterEventoOpen = false;
    this.isFilterEstadoEventoOpen = false;
    this.isFilterEstadoReporteOpen = false;
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

  // Utilidad para mostrar la fecha bonita en el input (Ej: "15 may 2026")
  public formatDateForUI(dateString: string): string {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    // Formateo elegante
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Escucha y procesa los cambios del usuario en el calendario de Inicio
  public onStartDateChanged(event: any) {
    if (!event || !event.detail || !event.detail.value) return;
    
    // Extrae de forma segura la cadena pura de la fecha (descarta horas)
    const rawValue = event.detail.value;
    this.filterForm.fechaInicio = rawValue.split('T')[0]; // <-- Punto y coma limpio aquí
    this.isStartDateModalOpen = false; // Cerramos el modal al elegir
  }

  // Escucha y procesa los cambios del usuario en el calendario de Fin
  public onEndDateChanged(event: any) {
    if (!event || !event.detail || !event.detail.value) return;
    
    const rawValue = event.detail.value;
    this.filterForm.fechaFin = rawValue.split('T')[0]; // <-- Punto y coma limpio aquí
    this.isEndDateModalOpen = false;
  }

  // Límite máximo para Fecha Inicio: No puede ser mayor a la Fecha Fin (si existe) ni mayor a Hoy
  get maxFechaInicio() {
    return this.filterForm.fechaFin ? this.filterForm.fechaFin : this.todayDate;
  }

  // Límite mínimo para Fecha Fin: No puede ser menor a la Fecha Inicio (si existe)
  get minFechaFin() {
    return this.filterForm.fechaInicio ? this.filterForm.fechaInicio : '2000-01-01'; 
  }

  // Límite máximo para Fecha Fin: Nunca puede ser mayor al día de Hoy
  get maxFechaFin() {
    return this.todayDate;
  }

  // * ==========================================================================
  // * EXPORTACIÓN DE DATOS
  // * ==========================================================================
  
  public downloadCSV() {
    console.log('Iniciando descarga de bitácora en formato CSV...');
    // Aquí irá la lógica para convertir this.eventsList a un archivo .csv
  }

  // * ==========================================================================
  // * VARIABLES PARA EL MODAL DE EDICIÓN
  // * ==========================================================================

  public openEditModal() {
    if (!this.selectedEvent) return;

    // Clonamos los datos actuales de la fila seleccionada hacia el formulario de edición
    this.editEventForm = {
      eco: this.selectedEvent.eco || '',
      region: this.selectedEvent.region || '',
      agencia: this.selectedEvent.agencia || '',
      matricula: this.selectedEvent.matricula || '',
      posicion: this.selectedEvent.posicion || '',
      vehiculo: '', // Se autollenaría si viniera en la API
      plataforma: this.selectedEvent.plataforma || '',
      evento: this.selectedEvent.tipoAlerta || '',
      estadoEvento: this.selectedEvent.status || '',
      estadoReporte: 'Reportado', // Valor por defecto mockeado
      fechaHoraOcurrencia: this.selectedEvent.fecha || '',
      comentario: this.selectedEvent.comentario || ''
    };

    this.editEventModal.present();
  }

  //* Guarda los cambios
  public updateEvent() {
    this.isLoading = true;
    setTimeout(() => {
      console.log('Evento modificado y guardado:', this.editEventForm);
      this.isLoading = false;
      this.editEventModal.dismiss();
    }, 800);
  }

  //* Se ejecuta al cerrar el modal de edición
  public resetEditForm() {
    this.isEditEcoDropdownOpen = false;
    this.isEditPlataformaDropdownOpen = false;
    this.isEditEventoDropdownOpen = false;
    this.isEditEstadoEventoDropdownOpen = false;
    this.isEditEstadoReporteDropdownOpen = false;
  }

  //* Si el usuario decide cambiar la unidad durante la edición
  public selectEditEco(unit: UnitReference) {
    this.editEventForm.eco = unit.eco;
    this.editEventForm.region = unit.region;
    this.editEventForm.agencia = unit.agencia;
    this.editEventForm.matricula = unit.matricula;
    this.editEventForm.posicion = unit.posicion;
    this.editEventForm.vehiculo = unit.vehiculo;

    this.ecoSearchQuery = '';
    this.filteredEcos = [...this.unitsCatalog];
    this.isEditEcoDropdownOpen = false;
  }
}