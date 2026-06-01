// ? ==========================================================================
// ? 1. CONTROLADOR DE MONITOREO DE EVENTOS - DOMAPPS
// ? ==========================================================================
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Auth } from '../../services/auth/auth';
import { HeaderComponent } from '../../components/header/header.component';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

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
  cantidad: number | string;
  comentario: string;
  estadoReporte: string;
  velocidad: string;
  enlaceEvidencia: string;
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
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
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

  public filtros: any = {
    searchUnit: '',
    region: '',
    agencia: '',
    plataforma: '',
    evento: '',
    estadoEvento: '',
    estadoReporte: ''
  };

  public isEcoDropdownOpenFilter: boolean = false;
  public ecoSearchQueryFilter: string = '';
  public isSearchingEcoFilter: boolean = false;
  public filteredEcosFilter: any[] = [];
  public regionsList: any[] = [];

  //* Variables para la Tabla Dinámica
  public dynamicColumns: string[] = []; 
  public dynamicRows: any[] = [];  
  
  // Controladores de apertura de los dropdowns del Modal de Filtros
  public isRegionDropdownOpenFilter: boolean = false;
  public isAgenciaDropdownOpenFilter: boolean = false;
  public isEventoDropdownOpenFilter: boolean = false;
  public isEstadoEventoDropdownOpenFilter: boolean = false;
  public isEstadoReporteDropdownOpenFilter: boolean = false;

  // Arreglo aislado para las agencias del filtro
  public filteredAgenciesFilter: any[] = [];

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

  //* Variable para guardar el username
  public username: string = 'Usuari';

  public isEditEcoDropdownOpen: boolean = false;
  public isEditPlataformaDropdownOpen: boolean = false;
  public isEditEventoDropdownOpen: boolean = false;
  public isEditEstadoEventoDropdownOpen: boolean = false;
  public isEditEstadoReporteDropdownOpen: boolean = false;

  //* Variables para llenar los selects
  public plataformasOptions: string[] = [];
  public eventosOptions: string[] = [];
  public estadosEventoOptions: string[] = [];
  public estadosReporteOptions: string[] = [];

  //* Variables para la tabla principal
  public events: any[] = [];
  public isLoadingTable: boolean = false;

  //* Variables para controlar los dropdowns customizados del Modal de Edición
  public isPlataformaDropdownOpenEdit: boolean = false;
  public isEventoDropdownOpenEdit: boolean = false;
  public isEstadoEventoDropdownOpenEdit: boolean = false;
  public isEstadoReporteDropdownOpenEdit: boolean = false;

  // ? ==========================================================================
  // ? BASE DE DATOS MOCK Y VARIABLES DE BUSCADOR
  // ? ==========================================================================
  
  // Dejamos el catálogo vacío esperando los datos del backend
  public unitsCatalog: UnitReference[] = [];

  // Variables del buscador
  public ecoSearchQuery: string = '';
  public filteredEcos: any[] = []; 
  public isSearchingEco: boolean = false; // Para mostrar un "cargando..." en el select
  
  // El "escuchador" inteligente para cuando el usuario teclea
  private searchSubject = new Subject<string>();

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
    comentario: '',
    enlaceEvidencia: '',
    velocidad: ''
  };

  constructor(
    private monitoringService: MonitoringService,
    private auth: Auth,
    private toastController: ToastController
  ) { 
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
    const userData = this.auth.getUserData();
    if (userData && userData.username) {
      this.username = userData.username; // Asigna el nombre (ej: "administrador")
    }
    
    this.loadEvents();
    this.loadUnits();
    this.loadFormSelectOptions();
    this.filteredEcos = [...this.unitsCatalog];
    
    
    // Calculamos la fecha actual en formato universal ISO (YYYY-MM-DD)
    const currentSystemDate = new Date();
    const year = currentSystemDate.getFullYear();
    const month = String(currentSystemDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentSystemDate.getDate()).padStart(2, '0');
    this.todayDate = `${year}-${month}-${day}`;

    // Carga inicial del tiempo de ocurrencia por defecto
    this.newEventForm.fechaHoraOcurrencia = this.getMexicoCSTMinus2Minutes();

    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.performBackendSearch(searchTerm);
    });
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

    const TEMPLATE_ID = 2; 

    this.monitoringService.getFormRecords(TEMPLATE_ID).subscribe({
      next: (response: any) => {
        console.log('📊 Datos crudos llegados del servidor:', response);

        // Si el servidor responde con algo que no es un arreglo, evitamos el colapso
        if (!response || !Array.isArray(response)) {
          this.dynamicRows = [];
          this.isLoading = false;
          return;
        }

        this.dynamicRows = response.map((item: any) => {
          const answers = item.answers || {};

          // 🛡️ PROTECCIÓN ULTRA-SEGURA PARA LA FECHA
          let fechaFinal = answers['FECHA'] || item.recordDatetime || '-';
          
          // Validamos estrictamente que sea un string antes de usar .includes()
          if (fechaFinal && typeof fechaFinal === 'string' && fechaFinal.includes('-')) {
            try {
              fechaFinal = new Date(fechaFinal.replace(/-/g, '/')).toLocaleString('es-MX', { 
                year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true 
              }) + ' (CST)';
            } catch (e) {
              console.warn('No se pudo formatear la fecha del registro:', item.recordId);
            }
          }

          // 1. Estructura Híbrida: Mapeo exacto en minúsculas para el Panel de Detalles
          const rowObj: any = {
            id: item.recordId,
            fechaRegistro: typeof fechaFinal === 'string' ? fechaFinal : '-', //
            
            eco: answers['ECO'] || '-',
            matricula: answers['MATRICULA'] || '-',
            region: answers['REGION'] || '-',
            agencia: answers['AGENCIA'] || '-',
            tipoAlerta: answers['TIPO DE ALERTA'] || '-',
            status: answers['ESTADO DEL EVENTO'] || '-',
            estadoReporte: answers['ESTADO DEL REPORTE'] || '-',
            plataforma: answers['FUENTE'] || answers['PROVEEDOR / EVENTO'] || '-',
            velocidad: answers['KM/H'] || '0',
            comentario: answers['COMENTARIOS'] || 'SIN COMENTARIOS',
            enlaceEvidencia: answers['EVIDENCIA'] || 'SIN EVIDENCIA',
            posicion: answers['POSICION'] || 'Sin posición',
            fecha: typeof fechaFinal === 'string' ? fechaFinal : '-',
            cantidad: answers['CANTIDAD'] || answers['CANTIDAD DE VECES'] || '1'
          };

          // 2. Copiamos las llaves en MAYÚSCULAS para row[col] en la tabla principal
          Object.keys(answers).forEach(key => {
            if (key) {
              const upperKey = key.toUpperCase().trim();
              rowObj[key] = answers[key];
              rowObj[upperKey] = answers[key];
            }
          });

          // Homologamos la fecha sanitizada en la propiedad plana de la fila
          rowObj['FECHA'] = rowObj.fechaRegistro;

          return rowObj;
        });

        console.log('🚀 Filas híbridas renderizadas con éxito:', this.dynamicRows);
        this.isLoading = false; 
      },
      error: (err: any) => {
        console.error('❌ Error crítico al procesar o cargar la tabla:', err);
        this.isLoading = false; 
        this.presentToast('No se pudieron cargar los registros de la base de datos.', 'danger');
      }
    });
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

  //* Carga las unidades en el select
  public loadUnits() {
    this.monitoringService.getUnitsCatalog().subscribe({
      next: (units: any[]) => {
        // Mapeamos lo que llega de la base de datos a lo que tu buscador espera
        this.unitsCatalog = units.map(u => ({
          eco: u.eco || u.ECO || '',
          region: u.region || u.REGION || '',
          agencia: u.agencia || u.AGENCIA || '',
          matricula: u.matricula || u.MATRICULA || '',
          posicion: u.posicion || u.POSICION || 'Sin posición',
          vehiculo: u.vehiculo || u.VEHICULO || 'Estándar'
        }));

        // Inicializamos la lista filtrada con todo el catálogo real
        this.filteredEcos = [...this.unitsCatalog];
      },
      error: (err) => {
        console.error('❌ Error al obtener el catálogo de unidades:', err);
      }
    });
  }

  // Se dispara cada vez que el usuario teclea algo en el buscador
  public onSearchInput(event: any) {
    // 👇 EL CAMBIO ESTÁ AQUÍ: En Ionic usamos event.detail.value 👇
    const term = event.detail.value; 
    
    if (term) {
      this.searchSubject.next(term);
    } else {
      // Si el usuario borra todo el texto, limpiamos la lista
      this.filteredEcos = [];
      this.isSearchingEco = false;
    }
  }

  // Se comunica con el backend para autocompletado
  private performBackendSearch(term: string) {
    if (!term || term.trim() === '') {
      this.filteredEcos = [];
      return;
    }

    this.isSearchingEco = true;
    this.monitoringService.searchVehicles(term).subscribe({
      next: (response) => {
        // Ahora la respuesta YA ES el arreglo directo
        this.filteredEcos = response || []; 
        this.isSearchingEco = false;
      },
      error: (err) => {
        this.filteredEcos = [];
        this.isSearchingEco = false;
      }
    });
  }

  // Cuando el usuario hace clic en el resultado encontrado
  public selectEco(vehiculo: any) {
    this.newEventForm.eco = vehiculo.eco || '';
    this.newEventForm.matricula = vehiculo.matricula || '';
    this.newEventForm.agencia = vehiculo.agencia || '';
    this.newEventForm.vehiculo = vehiculo.vehiculo || ''; 
    this.newEventForm.region = vehiculo.region || ''; 
    this.newEventForm.posicion = vehiculo.posicion || '';

    // Limpiamos el buscador y cerramos la lista
    this.ecoSearchQuery = '';
    this.filteredEcos = [];
    this.isEcoDropdownOpen = false; 
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

  public async submitEvent() {
    // 1. Validaciones básicas: Revisar que los campos obligatorios no estén vacíos
    if (!this.newEventForm.eco || !this.newEventForm.plataforma || !this.newEventForm.evento || !this.newEventForm.estadoEvento) {
      this.presentToast('Por favor, seleccione Unidad, Plataforma, Evento y Estado para continuar.', 'warning');
      return;
    }

    this.isLoading = true;

    // ==========================================================================
    // 🇲🇽 GENERACIÓN AUTOMÁTICA DE TIEMPO REAL DE MÉXICO (CST)
    // ==========================================================================
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const cstOffset = -6; 
    const cstDate = new Date(utcTime + (3600000 * cstOffset));

    const day = String(cstDate.getDate()).padStart(2, '0');
    const month = String(cstDate.getMonth() + 1).padStart(2, '0');
    const year = cstDate.getFullYear();
    const minutes = String(cstDate.getMinutes()).padStart(2, '0');
    
    let hours12 = cstDate.getHours();
    const ampm = hours12 >= 12 ? 'PM' : 'AM';
    hours12 = hours12 % 12;
    hours12 = hours12 ? hours12 : 12; 
    const strHours12 = String(hours12).padStart(2, '0');

    // 👇 QUITAMOS LOS SEGUNDOS DE ESTA CADENA 👇
    const fechaHora12hCST = `${day}/${month}/${year} ${strHours12}:${minutes} ${ampm} (CST)`;

    // Formato estándar de 24 Horas exigido estrictamente por MySQL
    const fechaHora24hMySQL = new Date().toLocaleString('sv-SE', { timeZone: 'America/Mexico_City' });
    // ==========================================================================

    // 3. Mapeo limpio utilizando la hora calculada automáticamente
    const respuestasFormulario = {
      "ECO": this.newEventForm.eco,
      "MATRICULA": this.newEventForm.matricula,
      "REGION": this.newEventForm.region,
      "AGENCIA": this.newEventForm.agencia,
      "PROVEEDOR / EVENTO": this.newEventForm.plataforma,
      "TIPO DE ALERTA": this.newEventForm.evento,
      "ESTADO DEL EVENTO": this.newEventForm.estadoEvento,
      "ESTADO DEL REPORTE": this.newEventForm.estadoReporte,
      "KM/H": this.newEventForm.velocidad || '0',
      "FECHA": fechaHora12hCST, // <-- Se guarda en texto con AM/PM (CST) para tu tabla y panel
      "COMENTARIOS": this.newEventForm.comentario || 'SIN COMENTARIOS',
      "EVIDENCIA": this.newEventForm.enlaceEvidencia || 'SIN EVIDENCIA',
      "CANTIDAD DE VECES": "1"
    };

    // 4. Transformación: Convertimos el objeto al Arreglo estricto que exige el backend
    const answersArray = Object.keys(respuestasFormulario).map(key => {
      return {
        fieldName: key,
        answer: String((respuestasFormulario as any)[key])
      };
    });

    // 5. Armamos el Payload final
    const payloadParaBackend = {
      templateID: 2, 
      recordDatetime: fechaHora24hMySQL, // <-- Mandamos 24h a la raíz para que la BD no inserte NULL
      answers: answersArray
    };

    console.log('📦 Payload balanceado (Raíz 24h / Respuestas 12h AM-PM):', payloadParaBackend);

    // 6. Enviamos la petición POST al servicio
    this.monitoringService.submitForm(payloadParaBackend).subscribe({
      next: (response) => {
        this.presentToast('✅ Evento guardado con éxito en la base de datos.', 'success');
        this.isLoading = false;
        this.newEventModal.dismiss(); 
        this.loadEvents(); // Recarga la bitácora
      },
      error: (err) => {
        console.error('❌ Error al guardar:', err);
        this.presentToast(err.error?.message || 'Error al conectar con el servidor', 'danger');
        this.isLoading = false;
      }
    });
  }

  // 3. Función de apoyo para mostrar mensajes flotantes
  private async presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3500,
      position: 'bottom',
      color: color,
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  //* 3. FUNCIÓN MAESTRA DE RESETEO (Se ejecuta automáticamente al cerrar el modal)
  public resetForm() {
    console.log('Limpiando datos del modal por cierre de ciclo de vida...');

    // 1. Reiniciar el formulario a valores vacíos e inyectar nueva hora base
    this.newEventForm = {
      eco: '', region: '', agencia: '', matricula: '', 
      posicion: '', vehiculo: '', plataforma: '', 
      evento: '', estadoEvento: '', estadoReporte: '',
      fechaHoraOcurrencia: this.getMexicoCSTMinus2Minutes(), 
      comentario: '',
      enlaceEvidencia: '',
      velocidad: ''  
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
    this.filtros.region = '';
  this.filtros.agencia = '';
  this.filtros.evento = '';
  this.filtros.estadoEvento = '';
  this.filtros.estadoReporte = '';
  this.filteredAgenciesFilter = [];
  this.ecoSearchQueryFilter = '';
  this.isSearchingEcoFilter = false;
  this.filteredEcosFilter = [];
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
      vehiculo: '', // Se autollenaría si se busca una unidad nueva
      plataforma: this.selectedEvent.plataforma || '',
      evento: this.selectedEvent.tipoAlerta || '',
      estadoEvento: this.selectedEvent.status || '',
      estadoReporte: this.selectedEvent.estadoReporte || '', // Mapeo correcto del reporte
      fechaHoraOcurrencia: this.selectedEvent.fecha || '',
      comentario: this.selectedEvent.comentario || 'SIN COMENTARIOS'
    };

    this.editEventModal.present();
  }

  //* Guarda los cambios en la base de datos
  public updateEvent() {
    // Validaciones de seguridad
    if (!this.selectedEvent) return;
    if (!this.editEventForm.eco || !this.editEventForm.plataforma || !this.editEventForm.evento) {
      this.presentToast('Faltan campos obligatorios por completar.', 'warning');
      return;
    }

    this.isLoading = true;

    const TEMPLATE_ID = 2; // Reporte de Alertas
    const RECORD_ID = this.selectedEvent.id;

    // 1. 📦 RECONSTRUIMOS EL ARREGLO DE RESPUESTAS (Arquitectura EAV)
    const answersArray = [
      { fieldName: 'ECO', answer: String(this.editEventForm.eco) },
      { fieldName: 'MATRICULA', answer: String(this.editEventForm.matricula) },
      { fieldName: 'REGION', answer: String(this.editEventForm.region) },
      { fieldName: 'AGENCIA', answer: String(this.editEventForm.agencia) },
      { fieldName: 'FUENTE', answer: String(this.editEventForm.plataforma) },
      { fieldName: 'TIPO DE ALERTA', answer: String(this.editEventForm.evento) },
      { fieldName: 'ESTADO DEL EVENTO', answer: String(this.editEventForm.estadoEvento) },
      { fieldName: 'ESTADO DEL REPORTE', answer: String(this.editEventForm.estadoReporte) },
      { fieldName: 'FECHA', answer: String(this.editEventForm.fechaHoraOcurrencia) },
      { fieldName: 'COMENTARIOS', answer: String(this.editEventForm.comentario || 'SIN COMENTARIOS') },
      
      // 🛡️ DATOS PROTEGIDOS: Se envían directo de selectedEvent para que MySQL no los borre al actualizar
      { fieldName: 'KM/H', answer: String(this.selectedEvent.velocidad || '0') },
      { fieldName: 'EVIDENCIA', answer: String(this.selectedEvent.enlaceEvidencia || 'SIN EVIDENCIA') },
      { fieldName: 'CANTIDAD', answer: String(this.selectedEvent.cantidad || '1') }
    ];

    const payload = { answers: answersArray };

    console.log('📡 Enviando actualización al backend:', payload);

    /// 2. 🚀 ENVIAMOS LA PETICIÓN 'PUT' AL SERVIDOR
    this.monitoringService.updateFormRecord(TEMPLATE_ID, RECORD_ID, payload).subscribe({
      next: (res: any) => {
        this.presentToast('✅ Evento modificado con éxito', 'success');
        this.isLoading = false;
        
        // Cerramos el modal de edición
        this.editEventModal.dismiss();

        // 🔄 1. ACTUALIZAMOS EL PANEL DERECHO EN VIVO (Con validación de seguridad para TypeScript)
        if (this.selectedEvent) {
          this.selectedEvent.eco = this.editEventForm.eco;
          this.selectedEvent.matricula = this.editEventForm.matricula;
          this.selectedEvent.region = this.editEventForm.region;
          this.selectedEvent.agencia = this.editEventForm.agencia;
          this.selectedEvent.plataforma = this.editEventForm.plataforma;
          this.selectedEvent.tipoAlerta = this.editEventForm.evento;
          this.selectedEvent.status = this.editEventForm.estadoEvento;
          this.selectedEvent.estadoReporte = this.editEventForm.estadoReporte;
          this.selectedEvent.fecha = this.editEventForm.fechaHoraOcurrencia;
          this.selectedEvent.comentario = this.editEventForm.comentario;
        }

        // 🔄 2. ACTUALIZAMOS LA TABLA EN VIVO (Sin recargar toda la página)
        const filaEnTabla = this.dynamicRows.find((row: any) => row.id === RECORD_ID);
        if (filaEnTabla) {
          filaEnTabla.eco = this.editEventForm.eco;
          filaEnTabla['ECO'] = String(this.editEventForm.eco);
          
          filaEnTabla.matricula = this.editEventForm.matricula;
          filaEnTabla['MATRICULA'] = String(this.editEventForm.matricula);
          
          filaEnTabla.region = this.editEventForm.region;
          filaEnTabla['REGION'] = String(this.editEventForm.region);
          
          filaEnTabla.agencia = this.editEventForm.agencia;
          filaEnTabla['AGENCIA'] = String(this.editEventForm.agencia);
          
          filaEnTabla.plataforma = this.editEventForm.plataforma;
          filaEnTabla['FUENTE'] = String(this.editEventForm.plataforma);
          
          filaEnTabla.tipoAlerta = this.editEventForm.evento;
          filaEnTabla['TIPO DE ALERTA'] = String(this.editEventForm.evento);
          
          filaEnTabla.status = this.editEventForm.estadoEvento;
          filaEnTabla['ESTADO DEL EVENTO'] = String(this.editEventForm.estadoEvento);
          
          filaEnTabla.estadoReporte = this.editEventForm.estadoReporte;
          filaEnTabla['ESTADO DEL REPORTE'] = String(this.editEventForm.estadoReporte);
          
          filaEnTabla.fecha = this.editEventForm.fechaHoraOcurrencia;
          filaEnTabla['FECHA'] = String(this.editEventForm.fechaHoraOcurrencia);
          
          filaEnTabla.comentario = this.editEventForm.comentario;
          filaEnTabla['COMENTARIOS'] = String(this.editEventForm.comentario);
        }
      },
      error: (err) => {
        console.error('❌ Error al actualizar el evento:', err);
        this.isLoading = false;
        
        if (err?.status === 401) {
          this.presentToast('⚠️ Su sesión ha expirado por seguridad. Redireccionando...', 'danger');
          setTimeout(() => this.logout(), 2000);
          return;
        }

        this.presentToast('Error al intentar modificar el evento en el servidor.', 'danger');
      }
    });
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

  //* Carga los select de nuevo evento
  public loadFormSelectOptions() {
    const TEMPLATE_ID = 2; 

    this.monitoringService.getFormStructure(TEMPLATE_ID).subscribe({
      next: (response: any) => {
        console.log('📦 RESPUESTA COMPLETA DEL BACKEND:', response);

        const fields = response.fields || [];

        // Cargamos todas las columnas de la base de datos por separado
        // Filtrando únicamente los bloques de texto largos o multimedia para no romper el ancho de la tabla
        this.dynamicColumns = fields
          .map((f: any) => f.fieldName)
          .filter((name: string) => name !== 'FECHA' && name !== 'COMENTARIOS' && name !== 'EVIDENCIA');

        console.log('📋 Columnas individuales activas en la tabla:', this.dynamicColumns);

        // Llenado dinámico de los selectores del formulario
        fields.forEach((field: any) => {
          if (!field.fieldName) return;
          
          const nameInDB = field.fieldName.toUpperCase().trim();

          if (nameInDB.includes('ESTADO DEL EVENTO') || nameInDB.includes('STATUS MIX')) {
            this.estadosEventoOptions = field.options || [];
          } 
          else if (nameInDB.includes('ESTADO DEL REPORTE') || nameInDB.includes('STATUS REPORTE')) {
            this.estadosReporteOptions = field.options || [];
          }
          else if (nameInDB.includes('PROVEEDOR') || nameInDB.includes('PLATAFORMA') || nameInDB === 'FUENTE') {
            this.plataformasOptions = field.options || [];
          } 
          else if (nameInDB.includes('ALERTA') || nameInDB === 'EVENTO') {
            this.eventosOptions = field.options || [];
          }
        });
      },
      error: (err) => {
        console.error('❌ Error al cargar la estructura en Ionic:', err);
      }
    });
  }

  public increaseQuantity() {
    if (!this.selectedEvent) return;

    const TEMPLATE_ID = 2; // ID de Reporte de Alertas
    const RECORD_ID = this.selectedEvent.id;

    // 1. Guardamos el estado numérico actual por si el internet falla y necesitamos hacer un rollback
    let cantidadOriginal = parseInt(String(this.selectedEvent.cantidad), 10);
    if (isNaN(cantidadOriginal)) cantidadOriginal = 1;

    // 2. Incrementamos localmente de inmediato para dar una experiencia rápida
    const incrementoVisual = cantidadOriginal + 1;
    this.selectedEvent.cantidad = incrementoVisual;

    const filaEnTabla = this.dynamicRows.find((row: any) => row.id === RECORD_ID);
    if (filaEnTabla) {
      filaEnTabla['cantidad'] = incrementoVisual;
      filaEnTabla['CANTIDAD'] = String(incrementoVisual);
    }

    console.log(`📡 Enviando incremento a la BD para el registro ID: ${RECORD_ID}...`);

    // 3. 🚀 DISPARAMOS LA PETICIÓN AL NUEVO ENDPOINT DEL SERVER
    this.monitoringService.incrementEventQuantity(TEMPLATE_ID, RECORD_ID).subscribe({
      next: (res: any) => {
        // El backend responde con el número real guardado, nos acoplamos a él por seguridad
        const cantidadRealBD = res.newQuantity;
        
        this.selectedEvent!.cantidad = cantidadRealBD;
        if (filaEnTabla) {
          filaEnTabla['cantidad'] = cantidadRealBD;
          filaEnTabla['CANTIDAD'] = String(cantidadRealBD);
        }
        console.log('✅ Cantidad sincronizada perfectamente con la base de datos MySQL');
      },
      error: (err) => {
        console.error('❌ Error al conectar con el endpoint de incremento:', err);
        
        // REVERSIÓN DE SEGURIDAD: Si el servidor dio error, regresamos el número original a la pantalla
        this.selectedEvent!.cantidad = cantidadOriginal;
        if (filaEnTabla) {
          filaEnTabla['cantidad'] = cantidadOriginal;
          filaEnTabla['CANTIDAD'] = String(cantidadOriginal);
        }
      }
    });
  }
  
  /**
   * 1. SELECCIONAR UNIDAD: Captura el vehículo elegido y cierra el dropdown
   */
  public selectEcoFilter(vehiculo: any) {
    // Si tu objeto viene del backend, guardamos el ECO limpio (ej: '2853')
    this.filtros.searchUnit = vehiculo.eco || vehiculo.label || vehiculo;
    
    // Cerramos el menú desplegable de filtros
    this.isEcoDropdownOpenFilter = false;
    
    // Limpiamos el buscador interno para la siguiente vez
    this.ecoSearchQueryFilter = '';
  }

  /**
   * 2. BUSCADOR EN VIVO: Filtra las unidades mientras el operador escribe
   */
  public onSearchInputFilter(event: any) {
    const val = event.target.value;
    this.ecoSearchQueryFilter = val ? val.trim() : '';

    if (this.ecoSearchQueryFilter === '') {
      this.filteredEcosFilter = [];
      return;
    }

    this.isSearchingEcoFilter = true;

    // 🚀 Llamamos al backend usando el mismo método de tu "onSearchInput" original
    // CORRECCIÓN: Cambia 'searchVehicles' por el nombre real de tu función de búsqueda
    this.monitoringService.searchVehicles(this.ecoSearchQueryFilter).subscribe({
      next: (res: any) => {
        // Guardamos los resultados en la lista del filtro
        this.filteredEcosFilter = res || [];
        this.isSearchingEcoFilter = false;
      },
      error: (err) => {
        console.error('❌ Error al buscar unidades en el filtro:', err);
        this.isSearchingEcoFilter = false;
      }
    });
  }

  public onRegionChangeFilter() {
    // 🛡️ Agregamos (r: any) para resolver el error TS7006 de tipo implícito
    const regionSeleccionada = this.regionsList.find((r: any) => r.name === this.filtros.region);
    
    if (regionSeleccionada) {
      this.filteredAgenciesFilter = regionSeleccionada.agencias || [];
    } else {
      this.filteredAgenciesFilter = [];
    }
    
    // Reseteamos la agencia seleccionada previamente
    this.filtros.agencia = '';
  }

}