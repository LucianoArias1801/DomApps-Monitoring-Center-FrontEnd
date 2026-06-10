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
              <ion-input formControlName="searchUnit" placeholder="ECO, Placa, VIN..."></ion-input>
            </ion-item>
          </div>

          <ion-row class="ion-no-padding">
            <ion-col size="6" class="ion-no-padding" style="padding-right: 6px;">
              <div class="input-group">
                <label class="field-label"><ion-icon name="calendar-outline"></ion-icon> Desde</label>
                <ion-item lines="none" class="custom-input-item">
                  <ion-input type="date" formControlName="startDate"></ion-input>
                </ion-item>
              </div>
            </ion-col>
            <ion-col size="6" class="ion-no-padding" style="padding-left: 6px;">
              <div class="input-group">
                <label class="field-label"><ion-icon name="calendar-outline"></ion-icon> Hasta</label>
                <ion-item lines="none" class="custom-input-item">
                  <ion-input type="date" formControlName="endDate"></ion-input>
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
    .custom-input-item { --background: #f8fafc; --border-radius: 8px; --padding-start: 12px; border: 1px solid #e2e8f0; border-radius: 8px; width: 100%; }
    ion-input { --color: #1e293b; font-size: 14px; }
    .custom-form-select { width: 100%; --placeholder-color: #94a3b8; --placeholder-opacity: 1; font-size: 14px; color: #1e293b; }
    .custom-form-select::part(container) { width: 100%; }
    .custom-form-select::part(icon) { color: #94a3b8; opacity: 1; }
  `]
})
export class FilterModalComponent implements OnInit {
  @Input() templateId!: number;
  @Input() currentFilters: any = {}; 
  @Input() formFields: any[] = []; // 🚀 Recibimos los campos de la BD

  public filterForm!: FormGroup;

  // Arreglos que guardarán los catálogos dinámicos
  public regionOptions: any[] = [];
  public eventTypeOptions: any[] = [];
  public agencyOptions: any[] = [];

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder
  ) {
    addIcons({ closeCircleOutline, searchOutline, calendarOutline, listOutline });
  }

  ngOnInit() {
    // 🚀 EXTRAEMOS LAS OPCIONES REALES DEL BACKEND
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
  }

  applyFilters() {
    this.modalCtrl.dismiss(this.filterForm.value);
  }

  clearFilters() {
    this.filterForm.reset({
      searchUnit: '', startDate: '', endDate: '',
      region: 'Todas', agency: 'Todas', eventType: 'Todas'
    });
    this.modalCtrl.dismiss(this.filterForm.value);
  }

  close() {
    this.modalCtrl.dismiss(); 
  }
}