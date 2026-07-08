import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import { documentAttachOutline, cloudUploadOutline, timeOutline, calendarOutline } from 'ionicons/icons';

import { SharedModalLayoutComponent } from '../../components/shared-modal-layout/shared-modal-layout.component';

@Component({
  selector: 'app-import-modal',
  templateUrl: './import-modal.component.html',
  styleUrls: ['./import-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, SharedModalLayoutComponent]
})
export class ImportModalComponent implements OnInit {
  @Input() dashboardTitle!: string; 
  
  public importForm!: FormGroup;
  public selectedFile: File | null = null;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private toastCtrl: ToastController
  ) {
    addIcons({ documentAttachOutline, cloudUploadOutline, timeOutline, calendarOutline });
  }

  ngOnInit() {
    const today = new Date();
    // Ajustamos para obtener YYYY-MM-DD
    const todayISO = today.toISOString().split('T')[0];
    
    // Ajustamos para obtener HH:mm
    const currentHours = String(today.getHours()).padStart(2, '0');
    const currentMinutes = String(today.getMinutes()).padStart(2, '0');
    const timeISO = `${currentHours}:${currentMinutes}`;

    this.importForm = this.fb.group({
      fechaCorte: [todayISO, Validators.required],
      horaCorte: [timeISO, Validators.required]
    });
  }

  // ===========================================================================
  // 📂 GESTIÓN DEL ARCHIVO
  // ===========================================================================
  public triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  public onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      // Opcional: Validar extensión si solo quieres Excel o CSV
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        this.presentToast('Formato no válido. Sube un archivo Excel o CSV.', 'warning');
        return;
      }
      this.selectedFile = file;
    }
  }

  public removeFile() {
    this.selectedFile = null;
    this.fileInput.nativeElement.value = ''; // Resetea el input HTML
  }

  // ===========================================================================
  // 🚀 ACCIONES DEL MODAL
  // ===========================================================================
  public applyImport() {
    if (this.importForm.invalid || !this.selectedFile) {
      this.presentToast('Falta el archivo o los parámetros obligatorios.', 'warning');
      return;
    }

    // Retornamos el archivo físicamente y el payload de parámetros extra
    const dataToReturn = {
      file: this.selectedFile,
      payload: this.importForm.value
    };

    this.modalCtrl.dismiss(dataToReturn);
  }

  public cancel() {
    this.modalCtrl.dismiss();
  }

  private async presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({ message, color, duration: 3000, position: 'bottom' });
    await toast.present();
  }
}