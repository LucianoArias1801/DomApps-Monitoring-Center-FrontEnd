import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'; 
import { addIcons } from 'ionicons';
import { forkJoin } from 'rxjs';
import { 
  cameraOutline, 
  ellipsisVertical, 
  openOutline, 
  downloadOutline, 
  cloudUploadOutline 
} from 'ionicons/icons';

import { ExportModalComponent } from '../../modals/export-modal/export-modal.component';
import { HeaderComponent } from '../../components/header/header.component';
import { DashboardsService } from '../../services/dashboards/dashboards'; 
import { ImportModalComponent } from 'src/app/modals/import-modal/import-modal.component';
import { Auth } from '../../services/auth/auth';

@Component({
  selector: 'app-dashboards-hub',
  templateUrl: './dashboards-hub.page.html',
  styleUrls: ['./dashboards-hub.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, HeaderComponent] 
})
export class DashboardsHubPage implements OnInit {

  public dashboards: any[] = [];
  public isLoading: boolean = true;
  public isVisualizador: boolean = false;

  constructor(
    private dashboardsService: DashboardsService, 
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private sanitizer: DomSanitizer,
    private auth: Auth
    
  ) {
    addIcons({ cameraOutline, ellipsisVertical, openOutline, downloadOutline, cloudUploadOutline });
  }

  ngOnInit() {
    const user = this.auth.getUserData();
    this.isVisualizador = user?.role === 'Visualizador';
    this.loadDashboards();
  }

  private loadDashboards() {
    this.isLoading = true;
    
    this.dashboardsService.getDashboards().subscribe({
      next: (data: any[]) => {
        if (!data || !Array.isArray(data)) {
          this.dashboards = [];
          this.isLoading = false;
          return;
        }

        this.dashboards = data.map(d => {
          let finalImageUrl: string | SafeUrl | null = d.imgUrl;

          if (finalImageUrl && typeof finalImageUrl === 'string' && finalImageUrl.includes('drive.google.com')) {
            let imageId: string | null = null;
            
            // Tu JSON viene con 'id=', este bloque extraerá perfectamente el ID
            if (finalImageUrl.includes('id=')) {
              const match = finalImageUrl.match(/id=([^&]+)/);
              imageId = match ? match[1] : null;
            } else if (finalImageUrl.includes('/file/d/')) {
              const match = finalImageUrl.match(/\/file\/d\/([^/]+)/);
              imageId = match ? match[1] : null;
            }
            
            if (imageId) {
              // 🚀 CAMBIO CLAVE: Usamos el CDN global de Google para imágenes públicas
              const cleanUrl = `https://lh3.googleusercontent.com/d/${imageId}`;
              finalImageUrl = this.sanitizer.bypassSecurityTrustUrl(cleanUrl);
            }
          }

          return {
            id: d.id,
            title: d.title || 'Tablero sin título',
            description: d.description || 'Sin descripción disponible.',
            powerBiUrl: d.embedUrl || '',
            imageUrl: finalImageUrl, 
            img_url: finalImageUrl,  // Este es el que lee tu archivo HTML
            endpointUrl: d.endpointUrl, 
            allowDownload: !!d.endpointUrl, 
            allowUpload: d.fileInput 
          };
        });
        
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error al conectar con el servidor:', err);
        this.isLoading = false;
        this.dashboards = [];
        this.presentToast('Error al conectar con el servidor', 'danger');
      }
    });
  }

  // ===========================================================================
  // 🖱️ FUNCIONES DE INTERACCIÓN
  // ===========================================================================

  public openDashboard(url: string) {
    if (!url || url === 'https://app.powerbi.com/') {
      this.presentToast('Este tablero no tiene una URL de Power BI configurada.', 'primary');
      return;
    }
    window.open(url, '_blank');
  }

  async openDownloadFilters(item: any) {
  const modal = await this.modalCtrl.create({
    component: ExportModalComponent,
    componentProps: { dashboardTitle: item.title }
  });
  
  await modal.present();
  const { data } = await modal.onWillDismiss();
  
  if (!data || !data.startDate || !data.endDate) return;
  
  if (!item.endpointUrl) {
    this.presentToast('Ruta de descarga no configurada.', 'danger');
    return;
  }

  this.presentToast(`Preparando reporte unificado de ${item.title}...`, 'primary');

  // 🚀 Le enviamos la 'data' completa al servicio. Él se encarga de las comas.
  this.dashboardsService.exportDashboardData(item.endpointUrl, data).subscribe({
    next: (blob: Blob) => {
      this.descargarArchivoFisico(blob, item.title, data.startDate, data.endDate);
      this.presentToast('¡Descarga completada exitosamente!', 'success');
    },
    error: (err) => {
      console.error('Error al descargar:', err);
      this.presentToast('Ocurrió un error al intentar descargar los datos.', 'danger');
    }
  });
}

  private descargarArchivoFisico(blob: Blob, titulo: string, inicio: string, fin: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanTitle = titulo.replace(/\s+/g, '_');
    a.download = `Reporte_${cleanTitle}_${inicio}_al_${fin}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  async openUploadModal(item: any) {
    if (!item.endpointUrl) {
      this.presentToast('Ruta de importación no configurada para este tablero.', 'danger');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: ImportModalComponent,
      componentProps: { dashboardTitle: item.title }
    });
    
    await modal.present();
    const { data } = await modal.onWillDismiss();
    
    // Si el usuario cancela o cierra el modal sin elegir archivo
    if (!data || !data.file) return;

    this.presentToast(`Procesando el archivo para ${item.title}...`, 'primary');

    // Enviamos la petición POST usando el endpointUrl (se asume que es la misma ruta pero en POST)
    this.dashboardsService.uploadDashboardData(item.endpointUrl, data.file, data.payload).subscribe({
      next: (response: any) => {
        // El backend devuelve success 200
        this.presentToast(response.message || 'Datos importados correctamente.', 'success');
      },
      error: (err: any) => {
        console.error('Error al subir datos:', err);
        // Manejamos los errores que envía tu backend en Python (409 Conflict, 500 Error, etc.)
        const errorMessage = err.error?.message || 'Ocurrió un error interno al procesar el archivo.';
        this.presentToast(errorMessage, 'danger');
      }
    });
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'primary') {
    const toast = await this.toastCtrl.create({ message, color, duration: 3000, position: 'bottom' });
    await toast.present();
  }
}