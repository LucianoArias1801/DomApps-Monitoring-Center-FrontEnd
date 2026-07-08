import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import { calendarOutline, listOutline, downloadOutline } from 'ionicons/icons';

import { SharedModalLayoutComponent } from '../../components/shared-modal-layout/shared-modal-layout.component';

// 🚀 Importamos tu nuevo servicio
import { OrganizationsService } from '../../services/organizations/organizations';

@Component({
  selector: 'app-export-modal',
  templateUrl: './export-modal.component.html',
  styleUrls: ['./export-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, SharedModalLayoutComponent]
})
export class ExportModalComponent implements OnInit {
  @Input() dashboardTitle!: string; 

  public exportForm!: FormGroup;
  public formattedDates: { [key: string]: string } = { startDate: '', endDate: '' };

  // 🌍 Variables de Organización
  public rawHierarchy: any[] = []; // Guarda la respuesta cruda del backend
  public regions: string[] = [];
  public agencies: string[] = [];
  public isLoadingFilters = false;

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private orgService: OrganizationsService, // 👈 Inyectamos el nuevo servicio
    private toastCtrl: ToastController
  ) {
    addIcons({ calendarOutline, listOutline, downloadOutline });
  }

  ngOnInit() {
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    const todayISO = this.toISODateString(today);
    const threeMonthsAgoISO = this.toISODateString(threeMonthsAgo);

    this.exportForm = this.fb.group({
      startDate: [threeMonthsAgoISO, Validators.required],
      endDate: [todayISO, Validators.required],
      region: [""], 
      agencia: [""] 
    });

    this.formattedDates['startDate'] = this.formatDate(threeMonthsAgoISO);
    this.formattedDates['endDate'] = this.formatDate(todayISO);

    // Disparamos la carga
    this.loadFilters();
  }

  // ===========================================================================
  // 🔍 CARGA DINÁMICA DE FILTROS Y CASCADA
  // ===========================================================================

  private loadFilters() {
    this.isLoadingFilters = true;
    this.orgService.getOrgHierarchy().subscribe({
      next: (data: any[]) => {
        this.rawHierarchy = data;
        this.regions = data.map(r => r.name);
        this.agencies = this.getAllAgencies(data); // Por defecto mostramos todas
        this.isLoadingFilters = false;
      },
      error: (err: any) => {
        console.error('Error cargando jerarquía:', err);
        this.isLoadingFilters = false;
      }
    });
  }

  private getAllAgencies(hierarchy: any[]): string[] {
    let allAgencies: string[] = [];
    hierarchy.forEach(region => {
      region.agencias.forEach((agencia: any) => {
        allAgencies.push(agencia.name);
      });
    });
    return allAgencies.sort(); 
  }

  // 🔄 Esta función se llama desde el HTML cuando el usuario cambia la Región
  public onRegionChange() {
    const selectedRegions = this.exportForm.get('region')?.value || [];
    const validRegions = selectedRegions.filter((r: string) => r !== '');

    if (validRegions.length === 0) {
      // Si eligen "Todas", mostramos todas las agencias posibles
      this.agencies = this.getAllAgencies(this.rawHierarchy);
    } else {
      // Filtramos la jerarquía para extraer solo agencias de la región seleccionada
      const filteredHierarchy = this.rawHierarchy.filter(r => validRegions.includes(r.name));
      this.agencies = this.getAllAgencies(filteredHierarchy);

      // Limpiamos las agencias seleccionadas si ya no pertenecen a la nueva región
      const currentAgencies = this.exportForm.get('agencia')?.value || [];
      const validAgencies = currentAgencies.filter((a: string) => this.agencies.includes(a) || a === '');
      this.exportForm.get('agencia')?.setValue(validAgencies, { emitEvent: false });
    }
  }

  // ===========================================================================
  // 📅 CONTROL DE CALENDARIOS (Queda igual a lo que tenías)
  // ===========================================================================

  public triggerDatePicker(inputElement: HTMLInputElement) {
    if (!inputElement) return;
    try {
      if (inputElement.showPicker) inputElement.showPicker();
      else inputElement.click();
    } catch (error) {
      inputElement.click();
    }
  }

  public onDateSelected(event: any, fieldName: string) {
    const selectedValue = event.target.value;
    if (!selectedValue) return;

    this.exportForm.get(fieldName)?.setValue(selectedValue);
    this.formattedDates[fieldName] = this.formatDate(selectedValue);
    this.autocorrectDateRange(fieldName, selectedValue);
  }

  private autocorrectDateRange(lastChangedField: string, valueString: string) {
    const startVal = this.exportForm.get('startDate')?.value;
    const endVal = this.exportForm.get('endDate')?.value;
    if (!startVal || !endVal) return;

    const startDate = new Date(startVal);
    const endDate = new Date(endVal);

    if (lastChangedField === 'startDate') {
      if (startDate > endDate) {
        this.updateField('endDate', startVal);
        return;
      }
      const maxEndDate = new Date(startDate);
      maxEndDate.setMonth(startDate.getMonth() + 3);
      if (endDate > maxEndDate) {
        this.updateField('endDate', this.toISODateString(maxEndDate));
      }
    } else {
      if (endDate < startDate) {
        this.updateField('startDate', endVal);
        return;
      }
      const minStartDate = new Date(endDate);
      minStartDate.setMonth(endDate.getMonth() - 3);
      if (startDate < minStartDate) {
        this.updateField('startDate', this.toISODateString(minStartDate));
      }
    }
  }

  private updateField(field: string, isoValue: string) {
    this.exportForm.get(field)?.setValue(isoValue);
    this.formattedDates[field] = this.formatDate(isoValue);
  }

  public formatDate(dateString: string): string {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`; 
    return dateString;
  }

  private toISODateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public getFormattedDate(fieldName: string): string {
    return this.formattedDates[fieldName] || '';
  }

  // ===========================================================================
  // 🎯 ACCIONES DEL MODAL
  // ===========================================================================

  public applyFilters() {
    if (this.exportForm.invalid) {
      this.presentToast('Por favor verifica los campos obligatorios.', 'warning');
      return;
    }
    
    // 1. Clonamos los valores
    const filtersToSend = { ...this.exportForm.value };

    // 2. Limpiamos las "Todas" (strings vacíos) para no confundir al backend
    if (filtersToSend.region && Array.isArray(filtersToSend.region)) {
      filtersToSend.region = filtersToSend.region.filter((r: string) => r !== '');
      if (filtersToSend.region.length === 0) delete filtersToSend.region;
    }

    if (filtersToSend.agencia && Array.isArray(filtersToSend.agencia)) {
      filtersToSend.agencia = filtersToSend.agencia.filter((a: string) => a !== '');
      if (filtersToSend.agencia.length === 0) delete filtersToSend.agencia;
    }

    // Devolvemos la data limpia al dashboard principal
    this.modalCtrl.dismiss(filtersToSend);
  }

  public cancel() {
    this.modalCtrl.dismiss();
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({ message, color, duration: 3000, position: 'bottom' });
    await toast.present();
  }
}