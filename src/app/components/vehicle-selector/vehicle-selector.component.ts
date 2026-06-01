import { Component, EventEmitter, Output, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Importamos tu servicio
import { DynamicFormsService } from '../../services/dynamic-forms/dynamic-forms'; 

@Component({
  selector: 'app-vehicle-selector',
  templateUrl: './vehicle-selector.component.html',
  styleUrls: ['./vehicle-selector.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class VehicleSelectorComponent implements OnInit, OnDestroy {
  
  @Input() templateId!: number;

  private _initialRecord: any = null;

  // 🚀 CAMBIO CRÍTICO: El interceptor ahora guarda el registro de forma segura
  @Input() set initialVehicle(record: any) {
    this._initialRecord = record;
    this.processInitialVehicle();
  }

  @Output() vehicleSelected = new EventEmitter<Record<string, string>>();

  // Estados de la interfaz
  public isDropdownOpen: boolean = false;
  public isSearching: boolean = false;
  public searchQuery: string = '';
  
  // Datos
  public searchResults: any[] = [];
  public selectedVehicle: any = null;

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  constructor(
    private dynamicFormsService: DynamicFormsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Escuchador reactivo para búsquedas manuales
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.performBackendSearch(term);
    });

    // 🎯 SEGUNDO DISPARO DE SEGURIDAD: Si el modal tardó en compilarse, 
    // procesamos el vehículo aquí cuando la directiva [(ngModel)] ya esté lista en el DOM.
    this.processInitialVehicle();
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  /**
   * Mapea, renderiza y emite los datos del vehículo de forma diferida
   * para ganarle a la asincronía del ciclo de renderizado de Angular/Ionic
   */
  private processInitialVehicle() {
    if (!this._initialRecord) {
      this.selectedVehicle = null;
      this.searchQuery = '';
      setTimeout(() => this.cdr.detectChanges(), 50);
      return;
    }

    // 1. Mapeamos los datos para pintar la tarjeta informativa inferior
    this.selectedVehicle = {
      eco: this._initialRecord['ECO'] || '',
      placa: this._initialRecord['MATRICULA'] || this._initialRecord['MATRÍCULA'] || '',
      region: this._initialRecord['REGION'] || this._initialRecord['REGIÓN'] || '',
      agencia: this._initialRecord['AGENCIA'] || '',
      marca: this._initialRecord['VEHICULO'] || this._initialRecord['VEHÍCULO'] || '',
      posicion: this._initialRecord['POSICION'] || this._initialRecord['POSICIÓN'] || ''
    };

    // 2. ⏱️ RETRASO ESTRATÉGICO: Esperamos a que termine la animación del modal
    // y que ngModel se asiente para clavar los valores sin que se borren solas.
    setTimeout(() => {
      if (this.selectedVehicle) {
        // Forzamos el valor directo en la caja de texto visible
        this.searchQuery = this.selectedVehicle.eco || '';

        // Construimos el diccionario relacional para el motor de formularios
        const autofillData: Record<string, string> = {
          'ECO': this.selectedVehicle.eco || '',
          'MATRICULA': this.selectedVehicle.placa || '',
          'MATRÍCULA': this.selectedVehicle.placa || '', 
          'REGION': this.selectedVehicle.region || '',
          'REGIÓN': this.selectedVehicle.region || '',   
          'AGENCIA': this.selectedVehicle.agencia || '',
          'VEHICULO': this.selectedVehicle.marca || '',
          'VEHÍCULO': this.selectedVehicle.marca || '',  
          'POSICION': this.selectedVehicle.posicion || '',
          'POSICIÓN': this.selectedVehicle.posicion || ''
        };

        // Emitimos al componente padre para vincular el formulario reactivo
        this.vehicleSelected.emit(autofillData);
        
        // Sincronizamos la vista de inmediato
        this.cdr.detectChanges();
      }
    }, 250); // Tiempo ideal en milisegundos para estabilizar componentes de Ionic
  }

  // ==========================================================================
  // OPERACIONES MANUALES DEL BUSCADOR (QUEDAN INTACTAS)
  // ==========================================================================

  public toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  public closeDropdown() {
    this.isDropdownOpen = false;
  }

  public onSearchInput(event: any) {
    const term = event.target.value?.trim();
    if (!term || term.length < 2) {
      this.searchResults = [];
      this.isSearching = false;
      return;
    }
    this.isSearching = true;
    this.searchSubject.next(term);
  }

  private performBackendSearch(term: string) {
    if (this.templateId === 1) {
      this.dynamicFormsService.searchMixVehicleByPlaca(term).subscribe({
        next: (response: any) => {
          const vehiclesArray = response.vehicle || [];
          this.searchResults = vehiclesArray.map((v: any) => ({ ...v, isActual: response.actualVehicle }));
          this.isSearching = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('❌ Error buscando en MIX:', err);
          this.searchResults = [];
          this.isSearching = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.dynamicFormsService.searchVehiclesByEco(term).subscribe({
        next: (response: any) => {
          const vehiclesArray = response.vehicle || [];
          this.searchResults = vehiclesArray.map((v: any) => ({ ...v, isActual: response.actualVehicle }));
          this.isSearching = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('❌ Error buscando por ECO:', err);
          this.searchResults = [];
          this.isSearching = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  public selectVehicle(vehicle: any) {
    this.selectedVehicle = vehicle;
    this.closeDropdown();
    this.searchQuery = vehicle.eco || '';

    const autofillData: Record<string, string> = {
      'ECO': vehicle.eco || '',
      'MATRICULA': vehicle.placa || '',
      'MATRÍCULA': vehicle.placa || '', 
      'REGION': vehicle.region || '',
      'REGIÓN': vehicle.region || '',   
      'AGENCIA': vehicle.agencia || '',
      'VEHICULO': vehicle.marca || '',
      'VEHÍCULO': vehicle.marca || '',  
      'POSICION': vehicle.posicion || '',
      'POSICIÓN': vehicle.posicion || ''
    };

    this.vehicleSelected.emit(autofillData);
    this.cdr.detectChanges();
  }
}