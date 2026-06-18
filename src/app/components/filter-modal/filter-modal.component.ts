import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { closeCircleOutline, searchOutline, calendarOutline, listOutline } from 'ionicons/icons';

@Component({
  selector: 'app-filter-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  template: `
    <ion-header class="ion-no-border custom-modal-header">
      <ion-toolbar>
        <ion-title class="modal-title">Filtrar Registros</ion-title>
        <ion-buttons slot="end">
          <ion-button color="medium" (click)="close()">
            <ion-icon slot="icon-only" name="close-circle-outline" style="font-size: 28px;"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding custom-modal-content">
      <div class="form-wrapper fade-in">
        <form [formGroup]="filterForm" class="login-form">
          
          <h4 class="section-title"><ion-icon name="search-outline"></ion-icon> Búsqueda General</h4>
          
          <div class="input-group">
            <label class="field-label">Buscar Unidad</label>
            <ion-item lines="none" class="custom-input-item">
              <ion-input formControlName="searchUnit" placeholder="ECO"></ion-input>
            </ion-item>
          </div>

          <ion-row class="ion-no-padding">
            <ion-col size="6" class="ion-no-padding" style="padding-right: 6px;">
              <div class="input-group">
                <label class="field-label">Desde</label>
                <ion-item lines="none" class="custom-input-item date-item">
                  <!-- INPUT OCULTO PARA EL DATE PICKER -->
                  <input 
                    #startDateInput
                    type="date" 
                    class="date-input-hidden"
                    [value]="filterForm.get('startDate')?.value || ''"
                    (change)="onDateSelected($event, 'startDate')"
                  />
                  
                  <!-- BOTÓN PERSONALIZADO CON ICONO -->
                  <ion-button 
                    fill="clear" 
                    class="date-trigger-btn"
                    (click)="triggerDatePicker(startDateInput)"
                  >
                    <ion-icon name="calendar-outline" class="calendar-icon"></ion-icon>
                    <span class="date-display">{{ getFormattedDate('startDate') || 'Desde' }}</span>
                  </ion-button>
                </ion-item>
              </div>
            </ion-col>

            <ion-col size="6" class="ion-no-padding" style="padding-left: 6px;">
              <div class="input-group">
                <label class="field-label">Hasta</label>
                <ion-item lines="none" class="custom-input-item date-item">
                  <!-- INPUT OCULTO PARA EL DATE PICKER -->
                  <input 
                    #endDateInput
                    type="date" 
                    class="date-input-hidden"
                    [value]="filterForm.get('endDate')?.value || ''"
                    (change)="onDateSelected($event, 'endDate')"
                  />
                  
                  <!-- BOTÓN PERSONALIZADO CON ICONO -->
                  <ion-button 
                    fill="clear" 
                    class="date-trigger-btn"
                    (click)="triggerDatePicker(endDateInput)"
                  >
                    <ion-icon name="calendar-outline" class="calendar-icon"></ion-icon>
                    <span class="date-display">{{ getFormattedDate('endDate') || 'Hasta' }}</span>
                  </ion-button>
                </ion-item>
              </div>
            </ion-col>
          </ion-row>

          <div class="divider"></div>

          <ng-container *ngIf="templateId === 2">
            <h4 class="section-title"><ion-icon name="list-outline"></ion-icon> Clasificación del Evento</h4>
            
            <div class="input-group" *ngIf="regionOptions.length > 0">
              <label class="field-label">Región</label>
              <ion-item lines="none" class="custom-input-item">
                <ion-select formControlName="region" interface="alert" placeholder="Selecciona una Región" class="custom-form-select">
                  <ion-select-option value="Todas">Todas</ion-select-option>
                  <ion-select-option *ngFor="let opt of regionOptions" [value]="opt.text">{{ opt.text | titlecase }}</ion-select-option>
                </ion-select>
              </ion-item>
            </div>

            <div class="input-group" *ngIf="eventTypeOptions.length > 0">
              <label class="field-label">Tipo de Alerta</label>
              <ion-item lines="none" class="custom-input-item">
                <ion-select formControlName="eventType" interface="alert" placeholder="Selecciona el Tipo" class="custom-form-select">
                  <ion-select-option value="Todas">Todas</ion-select-option>
                  <ion-select-option *ngFor="let opt of eventTypeOptions" [value]="opt.text">{{ opt.text | titlecase }}</ion-select-option>
                </ion-select>
              </ion-item>
            </div>
          </ng-container>

          <ng-container *ngIf="templateId === 1">
            <h4 class="section-title"><ion-icon name="list-outline"></ion-icon> Clasificación de Auditoría</h4>
            
            <div class="input-group" *ngIf="agencyOptions.length > 0">
              <label class="field-label">Agencia Operativa</label>
              <ion-item lines="none" class="custom-input-item">
                <ion-select formControlName="agency" interface="alert" placeholder="Selecciona una Agencia" class="custom-form-select">
                  <ion-select-option value="Todas">Todas</ion-select-option>
                  <ion-select-option *ngFor="let opt of agencyOptions" [value]="opt.text">{{ opt.text | titlecase }}</ion-select-option>
                </ion-select>
              </ion-item>
            </div>
          </ng-container>

        </form>
      </div>
    </ion-content>

    <ion-footer class="ion-no-border ion-padding custom-modal-footer">
      <ion-row>
        <ion-col size="6">
          <ion-button expand="block" fill="outline" color="medium" (click)="clearFilters()" style="--border-radius: 8px;">
            Limpiar
          </ion-button>
        </ion-col>
        <ion-col size="6">
          <ion-button expand="block" color="primary" (click)="applyFilters()" style="--border-radius: 8px;">
            Aplicar
          </ion-button>
        </ion-col>
      </ion-row>
    </ion-footer>
  `,
  styles: [`
    .custom-modal-header { background: #ffffff; --background: #ffffff; padding-top: 10px; border-bottom: 1px solid #f1f5f9; }
    .custom-modal-header ion-toolbar { --background: #ffffff; --color: #1e293b; }
    .modal-title { font-weight: 700; color: #1e293b; font-size: 18px; }
    .custom-modal-header ion-button { --color: #64748b; }
    .section-title { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin: 15px 0; display: flex; align-items: center; gap: 6px; }
    .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
    .custom-modal-footer { background: #ffffff; --background: #ffffff; border-top: 1px solid #f1f5f9; }
    .input-group { margin-bottom: 16px; }
    .field-label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
    
    .custom-input-item { 
      --background: #f8fafc; 
      --border-radius: 8px; 
      --padding-start: 12px; 
      --padding-end: 12px;
      border: 1px solid #e2e8f0; 
      border-radius: 8px; 
      width: 100%; 
      min-height: 48px;
    }
    
    ion-input { --color: #1e293b; font-size: 14px; }
    .custom-form-select { width: 100%; --placeholder-color: #94a3b8; --placeholder-opacity: 1; font-size: 14px; color: #1e293b; }
    .custom-form-select::part(container) { width: 100%; }
    .custom-form-select::part(icon) { color: #94a3b8; opacity: 1; }

    /* =========================================================================
       ✨ NUEVO ESTILO PARA EL CALENDARIO PERSONALIZADO
       ========================================================================= */
    .date-item {
      position: relative;
      padding: 0 !important;
      --padding-start: 0 !important;
      --padding-end: 0 !important;
      --inner-padding-end: 0 !important;
    }

    .date-input-hidden {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
      pointer-events: none;
    }

    .date-trigger-btn {
      --background: transparent !important;
      --background-hover: #f1f5f9 !important;
      --color: #1e293b;
      --border-radius: 8px;
      width: 100%;
      height: 48px;
      justify-content: flex-start;
      padding: 0 12px;
      font-weight: 500;
      text-transform: none;
      margin: 0;
      --padding-start: 12px;
      --padding-end: 12px;
      
      .calendar-icon {
        font-size: 22px;
        color: #0284c7;
        margin-right: 10px;
      }
      
      .date-display {
        font-size: 14px;
        color: #1e293b;
        font-weight: 500;
      }
    }

    /* Estilo cuando no hay fecha seleccionada */
    .date-trigger-btn .date-display:empty::before {
      content: 'Seleccionar fecha';
      color: #94a3b8;
      font-weight: 400;
    }
  `]
})
export class FilterModalComponent implements OnInit {
  @Input() templateId!: number;
  @Input() currentFilters: any = {}; 
  @Input() formFields: any[] = []; 

  public filterForm!: FormGroup;

  public regionOptions: any[] = [];
  public eventTypeOptions: any[] = [];
  public agencyOptions: any[] = [];

  public formattedDates: { [key: string]: string } = {
    startDate: '',
    endDate: ''
  };

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder
  ) {
    addIcons({ closeCircleOutline, searchOutline, calendarOutline, listOutline });
  }

  ngOnInit() {
    const regionField = this.formFields.find(f => f.fieldName.toUpperCase().includes('REGION'));
    const eventTypeField = this.formFields.find(f => f.fieldName.toUpperCase().includes('ALERTA'));
    const agencyField = this.formFields.find(f => f.fieldName.toUpperCase().includes('AGENCIA'));

    this.regionOptions = regionField?.options || [];
    this.eventTypeOptions = eventTypeField?.options || [];
    this.agencyOptions = agencyField?.options || [];

    this.filterForm = this.fb.group({
      searchUnit: [this.currentFilters?.searchUnit || ''],
      startDate: [this.currentFilters?.startDate || ''],
      endDate: [this.currentFilters?.endDate || ''],
      region: [this.currentFilters?.region || 'Todas'],
      agency: [this.currentFilters?.agency || 'Todas'],
      eventType: [this.currentFilters?.eventType || 'Todas']
    });

    if (this.currentFilters?.startDate) {
      this.formattedDates['startDate'] = this.formatDate(this.currentFilters.startDate);
    }
    if (this.currentFilters?.endDate) {
      this.formattedDates['endDate'] = this.formatDate(this.currentFilters.endDate);
    }
  }

  // ===========================================================================
  // 📅 MÉTODOS DEL CALENDARIO PERSONALIZADO
  // ===========================================================================

  triggerDatePicker(inputElement: HTMLInputElement) {
    if (!inputElement) return;
    
    try {
      if (inputElement.showPicker) {
        inputElement.showPicker();
      } else {
        inputElement.click();
      }
    } catch (error) {
      console.warn('Error al abrir el selector de fecha:', error);
      inputElement.click();
    }
  }

  onDateSelected(event: any, fieldName: string) {
    const value = event.target.value;
    if (value) {
      this.filterForm.get(fieldName)?.setValue(value);
      this.formattedDates[fieldName] = this.formatDate(value);
    } else {
      this.filterForm.get(fieldName)?.setValue('');
      this.formattedDates[fieldName] = '';
    }
  }

  /**
   * 🔧 CORREGIDO: Formatea la fecha sin problema de zona horaria
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      // Extraer año, mes y día directamente del string YYYY-MM-DD
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          // Formatear directamente sin usar new Date()
          return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        }
      }
      
      // Fallback: intentar con new Date (puede tener problemas de zona horaria)
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      // Usar getUTCDate() para evitar problemas de zona horaria
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  }

  getFormattedDate(fieldName: string): string {
    return this.formattedDates[fieldName] || '';
  }

  // ===========================================================================
  // 🎯 MÉTODOS DEL MODAL
  // ===========================================================================

  applyFilters() {
    this.modalCtrl.dismiss(this.filterForm.value);
  }

  clearFilters() {
    this.filterForm.reset({
      searchUnit: '', 
      startDate: '', 
      endDate: '',
      region: 'Todas', 
      agency: 'Todas', 
      eventType: 'Todas'
    });
    
    this.formattedDates['startDate'] = '';
    this.formattedDates['endDate'] = '';
    
    this.modalCtrl.dismiss(this.filterForm.value);
  }

  close() {
    this.modalCtrl.dismiss(); 
  }
}