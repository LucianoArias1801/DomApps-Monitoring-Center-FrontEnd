import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, IonModal } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

// Importamos el motor dinámico de la Fase 5 y el Header
import { DynamicFormComponent } from '../../components/dynamic-form/dynamic-form.component';
import { HeaderComponent } from '../../components/header/header.component';
import { VehicleSelectorComponent } from '../../components/vehicle-selector/vehicle-selector.component';
// Servicios y Modelos
import { DynamicFormsService } from '../../services/dynamic-forms/dynamic-forms';
import { FormSubmitPayload, FormStructureResponse, FormField } from '../../models/dynamic-forms.model';
import { Auth } from '../../services/auth/auth'; // Asegúrate de que la ruta coincida con tu proyecto

import { ModalController } from '@ionic/angular';
import { FilterModalComponent } from '../../components/filter-modal/filter-modal.component'; // Ajusta la ruta a donde lo hayas creado


// Iconos que usa la vista
import { addIcons } from 'ionicons';
import { addCircleOutline, downloadOutline, funnelOutline, imageOutline, pencilOutline, listOutline, closeCircle } from 'ionicons/icons';

@Component({
  selector: 'app-records-viewer',
  templateUrl: './records-viewer.page.html',
  styleUrls: ['./records-viewer.page.scss'],
  standalone: true,
  // 👇 AQUÍ DEBE ESTAR IMPORTADO JUNTO A LOS DEMÁS 👇
  imports: [
    IonicModule, 
    CommonModule, 
    HeaderComponent, 
    DynamicFormComponent, 
    VehicleSelectorComponent,
  ]
})
export class RecordsViewerPage implements OnInit {

  // Referencia al modal de creación en el HTML
  @ViewChild('newEventModal') newEventModal!: IonModal;
  @ViewChild('dynamicForm') dynamicForm!: DynamicFormComponent;

  // ==========================================================================
  // VARIABLES DE ESTADO Y DINAMISMO
  // ==========================================================================
  public currentTemplateId!: number;
  public currentTemplateName: string = 'Cargando...';
  
  public dynamicColumns: string[] = []; // Cabeceras de la tabla
  public dynamicRows: any[] = [];       // Filas de la tabla
  public isLoading: boolean = true;

  public formFields: any[] = [];

  public isEditing: boolean = false;
  
  public selectedRecord: any = null;    // El registro que se muestra en el panel derecho

  public activeFilters: any = {}; // Guarda los filtros aplicados

  public isLoadingMore: boolean = false; // Controla el spinner inferior de la tabla

  constructor(
    private route: ActivatedRoute,
    private dynamicFormsService: DynamicFormsService,
    private toastController: ToastController,
    private auth: Auth,
    private modalCtrl: ModalController
  ) {
    addIcons({ addCircleOutline, downloadOutline, funnelOutline, imageOutline, pencilOutline, listOutline, closeCircle });
  }

  // ==========================================================================
  // 1. INICIALIZACIÓN Y LECTURA DE URL
  // ==========================================================================
  ngOnInit() {
    // Nos suscribimos a los cambios en la URL (ej. de /records/1 a /records/2)
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('templateId');
      if (idParam) {
        this.currentTemplateId = parseInt(idParam, 10);
        console.log(`🌐 Vista Maestra activada para el Formulario ID: ${this.currentTemplateId}`);
        
        // Limpiamos el estado anterior al cambiar de módulo
        this.selectedRecord = null;
        this.dynamicRows = [];
        
        // Disparamos la carga de estructura y datos
        this.loadStructureAndEvents();
      }
    });
  }

  // ==========================================================================
  // 2. CONSTRUCCIÓN DINÁMICA DE LA TABLA
  // ==========================================================================
  
  /**
   * Lee la estructura del backend para saber el nombre del formulario y qué columnas dibujar
   */
  public loadStructureAndEvents() {
  this.isLoading = true;
  this.dynamicFormsService.getFormStructure(this.currentTemplateId).subscribe({
    next: (structure: any) => {
      this.currentTemplateName = structure.templateName;

      this.formFields = structure.fields;
      
      // 🚀 CORRECCIÓN 1: Limpiamos los "Enters" ocultos de los nombres de los campos
      this.dynamicColumns = structure.fields
        .map((f: any) => f.fieldName.replace(/[\r\n]+/g, '').trim())
        .filter((name: string) => {
          const cleanName = name.toUpperCase();
          return cleanName !== 'FECHA Y HORA DEL SUCESO' && 
                 cleanName !== 'COMENTARIOS' && 
                 cleanName !== 'EVIDENCIA' &&
                 cleanName !== 'ENLACE'; 
        });
      
      this.loadEvents();
    },
    error: (err: any) => {
      console.error('❌ Error al cargar la estructura:', err);
      this.isLoading = false;
      this.presentToast('Error al cargar la estructura del formato.', 'danger');
    }
  });
}

  /**
   * Lee los registros de la base de datos, los inyecta en la tabla
   * y mantiene la selección actualizada tras una edición.
   * @param preserveId Opcional. ID del registro que debe mantenerse seleccionado.
   */
  public loadEvents(preserveId?: number) {
    this.isLoading = true;

    // 🚀 NUEVO: Reactivar el Scroll Infinito en el DOM cada vez que cargamos la tabla desde cero
    const infiniteScroll = document.querySelector('ion-infinite-scroll');
    if (infiniteScroll) {
      infiniteScroll.disabled = false;
    }
    
    this.dynamicFormsService.getFormRecords(this.currentTemplateId, this.activeFilters).subscribe({
      next: (records: any[]) => {
        
        // 1. Sanitización y mapeo original intacto
        this.dynamicRows = records.map(record => {
          const cleanAnswers: any = {};
          
          if (record.answers) {
            Object.keys(record.answers).forEach(key => {
              const cleanKey = key.replace(/[\r\n]+/g, '').trim();
              cleanAnswers[cleanKey] = record.answers[key]; 
            });
          }

          // 🚀 CORRECCIÓN UTC: Reemplazamos el espacio por 'T' y agregamos la 'Z' al final
          return {
            recordId: record.recordId,
            fechaRegistro: record.recordDatetime ? record.recordDatetime.replace(' ', 'T') + 'Z' : null,
            comentario: record.comments,
            ...cleanAnswers 
          };
        });

        // 2. 🎯 LA MAGIA: Si veníamos de una edición, buscamos el registro fresco ya sanitizado
        if (preserveId) {
          const freshRecord = this.dynamicRows.find(r => r.recordId === preserveId);
          
          if (freshRecord) {
            // Al sobreescribir este objeto, Angular refresca la columna derecha al instante
            this.selectedRecord = freshRecord; 
          }
        }

        this.isLoading = false;

        setTimeout(() => {
          const container = document.querySelector('.table-container');
          // Comprobamos si el contenido de la tabla es más pequeño que el contenedor gris
          if (container && container.scrollHeight <= container.clientHeight) {
             // Como no hay scrollbar visible, obligamos a cargar la siguiente página
             if (this.dynamicRows.length > 0) {
               this.loadMoreEventsNative();
             }
          }
        }, 150);
      },
      error: (err: any) => {
        console.error('❌ Error al cargar los registros:', err);
        this.isLoading = false;
        this.presentToast('Error al obtener los registros.', 'danger');
      }
    });
  }

  // ==========================================================================
  // 3. INTERACCIÓN DE LA UI
  // ==========================================================================

  public onSelectRecord(row: any) {
    this.selectedRecord = row;
    console.log('📌 Registro seleccionado:', this.selectedRecord);
  }

  /**
   * Limpia el estado de edición y resetea los controles reactivos del formulario
   */
  public resetForm() {
    this.isEditing = false;
    
    // 🚀 CORREGIDO: Apuntamos directo al dynamicFormGroup de Angular
    if (this.dynamicForm && this.dynamicForm.dynamicFormGroup) {
      this.dynamicForm.dynamicFormGroup.reset();
    }
  }

  // ==========================================================================
  // 4. GUARDADO DE DATOS (CONEXIÓN CON LA FASE 5)
  // ==========================================================================

  // ============================================================================
// RECEPCIÓN Y ENVÍO DEL FORMULARIO DINÁMICO A TRAVÉS DE DYNAMICFORMSSERVICE
// ============================================================================

/**
 * Traduce el formato legible 12h CST (dd/mm/aaaa hh:mm AM/PM) 
 * al formato estricto de 24 horas que exige MySQL (YYYY-MM-DD HH:mm:ss)
 */
private parseCSTToMySQL(cstString: string): string {
  try {
    if (!cstString || cstString === '-') {
      return new Date().toLocaleString('sv-SE', { timeZone: 'America/Mexico_City' });
    }

    // Limpiamos el "(CST)" y espacios extra (Ejemplo: "31/05/2026 10:22 PM")
    const cleanStr = cstString.replace('(CST)', '').trim(); 
    
    // Separamos fecha, hora y el indicador AM/PM
    const [datePart, timePart, ampm] = cleanStr.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');

    let hh = parseInt(hours, 10);
    const mm = minutes;

    // Conversión a reloj militar de 24 horas
    if (ampm?.toUpperCase() === 'PM' && hh < 12) hh += 12;
    if (ampm?.toUpperCase() === 'AM' && hh === 12) hh = 0;

    const strHours = String(hh).padStart(2, '0');

    // Cadena compatible con MySQL
    return `${year}-${month}-${day} ${strHours}:${mm}:00`;
  } catch (e) {
    console.warn('⚠️ No se pudo parsear la fecha manual, usando hora del sistema.');
    return new Date().toLocaleString('sv-SE', { timeZone: 'America/Mexico_City' });
  }
}

/**
   * Puente seguro para disparar el guardado desde el footer del modal
   * sin importar en qué formato (SwitchCase) nos encontremos.
   */
  public triggerFormSubmit() {
    if (this.dynamicForm) {
      this.dynamicForm.prepareSubmit();
    } else {
      console.error('❌ No se encontró el formulario activo.');
      this.presentToast('Error: El formulario aún no está listo', 'danger');
    }
  }

  /**
  * Función Maestra: Se ejecuta cuando el formulario dinámico es validado.
  * 🚀 CORREGIDO: Ahora acepta 'eventData: any' para solucionar el error TS2345 de Angular
  */
  public submitRecord(formData: any) {
    this.isLoading = true;

    if (this.isEditing) {
      // 🎯 GUARDAMOS EL ID ACTUAL ANTES DE QUE EL MODAL SE CIERRE
      const targetRecordId = this.selectedRecord.recordId;

      this.dynamicFormsService.updateFormRecord(this.currentTemplateId, targetRecordId, formData).subscribe({
        next: (res) => {
          this.presentToast('✅ Registro actualizado correctamente', 'success');
          this.newEventModal.dismiss();
          
          // 🚀 ENVIAMOS EL ID para que la recarga lo conserve seleccionado
          this.loadEvents(targetRecordId); 
          
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Error al actualizar:', err);
          this.presentToast('Error al intentar guardar los cambios.', 'danger');
          this.isLoading = false;
        }
      });

    } else {
      // MODO CREACIÓN (Tu código original se queda exactamente igual)
      this.dynamicFormsService.submitForm(formData).subscribe({
        next: (res) => {
          this.presentToast('✅ Registro guardado correctamente', 'success');
          this.newEventModal.dismiss();
          this.loadEvents();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Error al crear:', err);
          this.presentToast('Error al guardar el nuevo registro.', 'danger');
          this.isLoading = false;
        }
      });
    }
  }
  // Esta función toma el diccionario del selector y se lo inyecta al formulario dinámico
public onVehicleSelected(data: Record<string, string>) {
  console.log('📦 Datos de unidad recibidos en la Vista Maestra:', data);
  if (this.dynamicForm) {
    this.dynamicForm.patchFormValues(data);
  }
}

  //

  // ==========================================================================
  // 5. STUBS PARA FUTURAS IMPLEMENTACIONES (Opcionales por ahora)
  // ==========================================================================
  public downloadCSV() {
    this.isLoading = true;
    this.presentToast('Generando reporte en el servidor, por favor espere...', 'warning');

    // Consumimos el nuevo endpoint del servicio mandándole los filtros de la pantalla
    this.dynamicFormsService.downloadFormRecordsCSV(this.currentTemplateId, this.activeFilters).subscribe({
      next: (blob: Blob) => {
        // Creamos una URL virtual temporal que apunta al archivo binario procesado en Node.js
        const url = URL.createObjectURL(blob);
        
        // Creamos un disparador de descarga invisible en el navegador
        const link = document.createElement('a');
        link.setAttribute('href', url);
        
        // Nombramos el archivo de acuerdo a la bitácora activa
        const fileName = `Reporte_${this.currentTemplateName.replace(/\s+/g, '_')}.csv`;
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // Limpieza de memoria del DOM

        this.isLoading = false;
        this.presentToast('¡Archivo CSV descargado con éxito!', 'success');
      },
      error: (err) => {
        console.error('❌ Error al descargar el CSV desde el backend:', err);
        this.presentToast('Error al procesar la descarga en el servidor. Intente de nuevo.', 'danger');
        this.isLoading = false;
      }
    });
  }

  // =========================================================
  // FUNCIÓN PARA ABRIR EL MODAL DE FILTROS
  // =========================================================
  public async openFilters() {
    const modal = await this.modalCtrl.create({
      component: FilterModalComponent,
      componentProps: {
        templateId: this.currentTemplateId,
        currentFilters: this.activeFilters // Le mandamos lo que ya estaba seleccionado
      }
    });

    await modal.present();

    // Cuando el modal se cierra, cachamos los datos
    const { data } = await modal.onDidDismiss();

    if (data) {
      this.activeFilters = data; // Guardamos el estado
      this.loadEvents();         // Recargamos la tabla
    }
  }

  /**
   * 🟢 Abre el modal en modo CREACIÓN (Registro Nuevo)
   * Limpia los datos anteriores y resetea el formulario para que inicie en blanco
   */
  public openCreateModal() {
    this.isEditing = false;
    this.selectedRecord = null; // Nos aseguramos de no arrastrar datos de otro click
    this.resetForm();           // Vaciamos todos los campos

    if (this.newEventModal) {
      this.newEventModal.present();
    }
  }

  /**
   * Abre el modal configurado en modo EDICIÓN
   * Carga los datos actuales del registro seleccionado en los controles reactivos
   */
  public openEditModal() {
    if (!this.selectedRecord) return;
    
    this.isEditing = true;
    
    // Abrimos el modal usando la referencia nativa de tu HTML (#newEventModal)
    if (this.newEventModal) {
      this.newEventModal.present();
    }
  }

  // ==========================================================================
  // LÓGICA DE SUMA DE CANTIDAD (ACTUALIZACIÓN OPTIMISTA)
  // ==========================================================================
  public increaseQuantity() {
    if (!this.selectedRecord) return;

    // 1. Identificar cómo se llama la columna en este formato específico
    const qtyKey = this.selectedRecord['CANTIDAD DE VECES'] !== undefined ? 'CANTIDAD DE VECES' :
                   this.selectedRecord['CANTIDAD'] !== undefined ? 'CANTIDAD' : null;

    if (!qtyKey) return;

    // 2. Extraer el valor actual y sumarle 1 matemáticamente
    const currentQty = parseInt(this.selectedRecord[qtyKey] || '0', 10);
    const newQty = currentQty + 1;

    // 3. ✨ MAGIA VISUAL: Actualizamos la interfaz de inmediato sin esperar al servidor
    this.selectedRecord[qtyKey] = newQty.toString();

    // 4. Buscar el ID real de este campo en la base de datos
    const fieldDef = this.formFields.find((f: any) => f.fieldName.toUpperCase().replace(/[\r\n]+/g, '').trim() === qtyKey);

    if (!fieldDef) {
       console.error('❌ No se encontró el fieldId de la cantidad en la estructura.');
       this.presentToast('Error interno: No se pudo localizar el campo en la BD.', 'danger');
       return;
    }

    // 5. Armamos el paquete parcial exacto como lo pide tu Node.js (updateFormRecord)
    const payload = {
      answers: [
        {
          fieldId: fieldDef.id,
          answer: newQty.toString()
        }
      ]
    };

    // 6. Enviamos el parche silencioso al servidor
    this.dynamicFormsService.updateFormRecord(this.currentTemplateId, this.selectedRecord.recordId, payload).subscribe({
      next: () => {
        console.log(`✅ Cantidad incrementada a ${newQty} en la base de datos.`);
        // Opcional: Puedes lanzar un presentToast('Cantidad actualizada', 'success') sutil si lo deseas
      },
      error: (err: any) => {
        console.error('❌ Error al actualizar la cantidad:', err);
        // Si el servidor falla (sin internet), revertimos el número visualmente
        this.selectedRecord[qtyKey] = currentQty.toString();
        this.presentToast('Error de red: No se pudo guardar la nueva cantidad', 'danger');
      }
    });
  }

  // ==========================================================================
  // UTILS
  // ==========================================================================
  private async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }

  // ============================================================================
// AUTO-LLENADO DE FECHA Y HORA EN TIEMPO REAL (MÉXICO CST - 12 HORAS)
// ============================================================================

/**
 * Genera la cadena de texto exacta con la hora actual de la CDMX 
 * formateada bajo el estándar estricto: dd/mm/aaaa hh:mm AM/PM (CST)
 */
private getMexicoCSTDateTimeString(): string {
  const now = new Date();
  
  // Forzamos la extracción de componentes en la zona horaria de México
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  const parts = formatter.formatToParts(now);
  let month = '', day = '', year = '', hour = '', minute = '', ampm = '';
  
  parts.forEach(p => {
    if (p.type === 'month') month = p.value;
    if (p.type === 'day') day = p.value;
    if (p.type === 'year') year = p.value;
    if (p.type === 'hour') hour = p.value;
    if (p.type === 'minute') minute = p.value;
    if (p.type === 'dayPeriod') ampm = p.value.toUpperCase();
  });
  
  return `${day}/${month}/${year} ${hour}:${minute} ${ampm} (CST)`;
}

/**
 * Se ejecuta automáticamente en milisegundos cuando el modal comienza a abrirse.
 * Espera de forma segura a que los campos dinámicos carguen de la BD para inyectar la fecha.
 */
  public onModalOpen() {
    const cstTimeString = this.getMexicoCSTDateTimeString();
    
    // Muestreo rápido (100ms) para esperar a que el formulario dinámico e instancie en memoria
    const checkExist = setInterval(() => {
      if (this.dynamicForm && this.dynamicForm.dynamicFormGroup && this.formFields) {
        
        if (this.isEditing && this.selectedRecord) {
          // 🚀 AUTO-LLENADO EN MODO EDICIÓN
          this.formFields.forEach((field: any) => {
            const controlName = 'field_' + field.id;
            const cleanFieldName = field.fieldName.replace(/[\r\n]+/g, '').trim();
            const savedValue = this.selectedRecord[cleanFieldName];
            
            if (savedValue !== undefined && this.dynamicForm.dynamicFormGroup.contains(controlName)) {
              let valueToPatch = savedValue;

              // Traducir Texto a ID para SELECT estándar
              if (field.type === 'SELECT' && field.options) {
                const matchingOption = field.options.find(
                  (o: any) => String(o.text).toUpperCase().trim() === String(savedValue).toUpperCase().trim()
                );
                if (matchingOption) valueToPatch = Number(matchingOption.id);
              }

              // Traducir arreglo de Textos a arreglo de IDs para MULTI_SELECT
              if (field.type === 'MULTI_SELECT' && field.options) {
                const textArray = Array.isArray(savedValue) ? savedValue : [savedValue];
                valueToPatch = field.options
                  .filter((o: any) => 
                    textArray.some(t => String(t).toUpperCase().trim() === String(o.text).toUpperCase().trim())
                  )
                  .map((o: any) => Number(o.id));
              }
              
              // ⏱️ EL SECRETO: Micro-retraso para permitir al componente hijo renderizar sus opciones
              setTimeout(() => {
                const control = this.dynamicForm.dynamicFormGroup.get(controlName);
                if (control) {
                  control.setValue(valueToPatch, { emitEvent: true });
                  control.updateValueAndValidity(); // Forzamos a Angular a redibujar el componente visual
                }
              }, 150);
            }
          });
          
          // Llenamos las observaciones generales de la cabecera
          setTimeout(() => {
            if (this.dynamicForm.dynamicFormGroup.contains('general_comments')) {
              this.dynamicForm.dynamicFormGroup.patchValue({
                general_comments: this.selectedRecord.comentario || this.selectedRecord.comments || ''
              });
            }
          }, 150);
          
          clearInterval(checkExist); // Detenemos el reloj de muestreo principal

        } else {
          // 🕒 AUTO-LLENADO EN MODO CREACIÓN
          
          // 1. Buscamos el campo de Fecha
          const fechaField = this.formFields.find(
            (f: any) => f.fieldName.toUpperCase().trim() === 'FECHA Y HORA' || f.fieldName.toUpperCase().includes('FECHA')
          );
          
          // 2. 🛡️ NUEVO: Buscamos el campo de Cantidad
          const cantidadField = this.formFields.find(
            (f: any) => f.fieldName.toUpperCase().trim() === 'CANTIDAD DE VECES' || f.fieldName.toUpperCase().trim() === 'CANTIDAD'
          );
          
          // 3. Inyectamos la Fecha actual
          if (fechaField) {
            const controlName = 'field_' + fechaField.id;
            if (this.dynamicForm.dynamicFormGroup.contains(controlName)) {
              this.dynamicForm.dynamicFormGroup.patchValue({ [controlName]: cstTimeString });
            }
          }

          // 4. 🚀 CORRECCIÓN: Inyectamos el valor por defecto a la Cantidad (1)
          if (cantidadField) {
            const qtyControlName = 'field_' + cantidadField.id;
            if (this.dynamicForm.dynamicFormGroup.contains(qtyControlName)) {
              // Si prefieres que inicie en 0, cambia el 1 de la siguiente línea
              this.dynamicForm.dynamicFormGroup.patchValue({ [qtyControlName]: '1' }); 
            }
          }

          clearInterval(checkExist);
        }
      }
    }, 100);

    // Rompe el bucle automáticamente a los 4 segundos por seguridad
    setTimeout(() => clearInterval(checkExist), 4000);
  }

  // ==========================================================================
  // LÓGICA DE PAGINACIÓN POR SCROLL INTERNO NATIVO
  // ==========================================================================
  
  /**
   * Escucha el movimiento del contenedor de la tabla y calcula si llegó al fondo
   */
  public onTableScroll(event: any) {
    const element = event.target;
    
    // Margen de tolerancia de 5px para absorber diferencias de zoom en navegadores
    const threshold = 5; 
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + threshold;

    // Si llegó al fondo del div, no está cargando nada actualmente y ya hay datos en pantalla
    if (isAtBottom && !this.isLoadingMore && !this.isLoading && this.dynamicRows.length > 0) {
      this.loadMoreEventsNative();
    }
  }

  /**
   * Realiza la petición al backend solicitando el lote de los siguientes 20 registros
   */
  private loadMoreEventsNative() {
    this.isLoadingMore = true;

    // Localizamos el ID más antiguo (el último de la lista actual)
    const oldestRecordId = this.dynamicRows[this.dynamicRows.length - 1].recordId;

    // Fusionamos los filtros de tu modal con la ID del cursor de paginación
    const paginationFilters = { 
      ...this.activeFilters, 
      lastId: oldestRecordId 
    };

    this.dynamicFormsService.getFormRecords(this.currentTemplateId, paginationFilters).subscribe({
      next: (newRecords: any[]) => {
        if (newRecords.length === 0) {
          this.presentToast('Has llegado al final del historial.', 'warning');
        } else {
          // Mapeamos y sanitizamos el nuevo lote de respuestas de la BD
          const formattedNewRecords = newRecords.map(record => {
            const cleanAnswers: any = {};
            if (record.answers) {
              Object.keys(record.answers).forEach(key => {
                const cleanKey = key.replace(/[\r\n]+/g, '').trim();
                cleanAnswers[cleanKey] = record.answers[key]; 
              });
            }
            return {
              recordId: record.recordId,
              // 🚀 CORRECCIÓN UTC: Forzamos la zona horaria universal
              fechaRegistro: record.recordDatetime ? record.recordDatetime.replace(' ', 'T') + 'Z' : null,
              comentario: record.comments,
              ...cleanAnswers 
            };
          });

          // Concatenamos el nuevo lote abajo de tus registros actuales sin parpadear
          this.dynamicRows = [...this.dynamicRows, ...formattedNewRecords];
        }
        this.isLoadingMore = false; // Apagamos el indicador
      },
      error: (err: any) => {
        console.error('❌ Error al paginar registros:', err);
        this.presentToast('Error de red al intentar cargar más filas.', 'danger');
        this.isLoadingMore = false;
      }
    });
  }
}