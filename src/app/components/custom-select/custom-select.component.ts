import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { addIcons } from 'ionicons';
import { chevronDownOutline } from 'ionicons/icons';

// 1. Interfaz estandarizada para las opciones que recibirá este select
export interface SelectOption {
  id: any;
  text: string;
  subtitle?: string; // Útil para mostrar "MIX" o detalles extra en la lista
}

@Component({
  selector: 'app-custom-select',
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  // 2. INYECCIÓN CRÍTICA: Le decimos a Angular que este componente funciona como un input de formulario
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ]
})
export class CustomSelectComponent implements ControlValueAccessor {

  // ==========================================================================
  // INPUTS: Configuraciones que recibimos desde el componente padre
  // ==========================================================================
  @Input() label: string = 'Seleccione';
  @Input() placeholder: string = 'Buscar...';
  @Input() options: SelectOption[] = [];
  
  // Controladores de estado visual
  @Input() searchable: boolean = false; // ¿Mostramos barra de búsqueda?
  @Input() loading: boolean = false;    // ¿Mostramos el spinner de cargando?
  @Input() disabled: boolean = false;

  // ==========================================================================
  // OUTPUTS: Eventos que emitimos al componente padre
  // ==========================================================================
  @Output() searchChange = new EventEmitter<string>(); // Emite cuando el usuario teclea en el buscador

  // ==========================================================================
  // ESTADO INTERNO
  // ==========================================================================
  public isOpen: boolean = false;
  public searchQuery: string = '';
  
  // El valor seleccionado (Puede ser el ID numérico o un string, dependiendo de la BD)
  public value: any = null;
  // El texto legible que mostramos al usuario en la caja cerrada
  public displayValue: string = '';

  constructor() {
    addIcons({ chevronDownOutline });
  }

  // ==========================================================================
  // LÓGICA DE INTERFAZ DE USUARIO (UI)
  // ==========================================================================
  
  public toggleDropdown() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.searchQuery = ''; // Limpiamos la búsqueda al cerrar
    }
  }

  public closeDropdown() {
    this.isOpen = false;
    this.searchQuery = '';
  }

  public onSearchInput(event: any) {
    const term = event.detail.value;
    this.searchQuery = term;
    // Emitimos el texto al padre (ej. para buscar en la BD usando el ECO)
    this.searchChange.emit(term);
  }

  public selectItem(option: SelectOption) {
    this.value = option.id;
    this.displayValue = option.text;
    
    // Notificamos a Angular Forms que el valor cambió
    this.onChange(this.value);
    this.onTouch();
    
    this.closeDropdown();
  }

  // ==========================================================================
  // IMPLEMENTACIÓN DE CONTROL VALUE ACCESSOR (Conexión con Formularios Reactivos)
  // ==========================================================================
  
  // Funciones vacías que Angular llenará cuando conectemos el formControlName
  onChange = (value: any) => {};
  onTouch = () => {};

  // Angular llama a este método para escribir un valor en nuestro componente (Ej: al editar un registro)
  writeValue(obj: any): void {
    this.value = obj;
    // Buscamos el texto correspondiente al ID para mostrarlo bonito en la caja
    const selectedOption = this.options.find(o => o.id === obj);
    this.displayValue = selectedOption ? selectedOption.text : '';
  }

  // Registra la función callback que avisa a Angular de un cambio
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  // Registra la función callback que avisa a Angular que el input fue "tocado"
  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  // Permite a Angular deshabilitar nuestro componente (Ej: form.disable())
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}