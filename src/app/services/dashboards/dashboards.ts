import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';


// 🛡️ Importamos el environment y tu servicio de Auth (Ajusta las rutas relativas si es necesario)
import { environment } from '../../../environments/environment'; 
import { Auth } from '../auth/auth'; 

// ===========================================================================
// 📦 INTERFACES
// ===========================================================================
export interface DashboardItem {
  id: number;
  title: string;
  description: string;
  powerBiUrl: string;
  allowDownload: boolean;
  allowUpload: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardsService {

  // Domain base de tu API de Node.js (Viene del enviroment)
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) { }

  /**
   * Genera los cabeceros HTTP inyectando el Token JWT de seguridad.
   */
  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ===========================================================================
  // 📊 DATOS SIMULADOS PARA LA INTERFAZ (UI)
  // ===========================================================================
  private mockDashboards: DashboardItem[] = [
    {
      id: 1, // ⚠️ Este ID debe coincidir con un templateId real en tu base de datos (Ej: 1)
      title: 'Monitoreo de Alertas Generales',
      description: 'Vista global de todas las alertas generadas por las unidades en ruta.',
      powerBiUrl: 'https://app.powerbi.com/view?r=tu_enlace_falso_1',
      allowDownload: true,
      allowUpload: false
    },
    {
      id: 2,
      title: 'Auditorías de Cumplimiento',
      description: 'Métricas de revisiones físicas y estatus de los vehículos operativos.',
      powerBiUrl: 'https://app.powerbi.com/view?r=tu_enlace_falso_2',
      allowDownload: true,
      allowUpload: true
    },
    {
      id: 3,
      title: 'Rendimiento de Operadores',
      description: 'Estadísticas de manejo, excesos de velocidad y fatiga por conductor.',
      powerBiUrl: 'https://app.powerbi.com/view?r=tu_enlace_falso_3',
      allowDownload: false,
      allowUpload: false
    }
  ];

  /**
   * Obtiene los tableros desde el endpoint identificado de la API.
   */
  public getDashboards(): Observable<any[]> {
    // 🎯 Añadimos "/list" para conectar con el nuevo enrutador explícito del backend
    return this.http.get<any[]>(`${this.baseUrl}/powerbi/dashboards`, {
      headers: this.getHeaders()
    });
  }

  /**
   * 📥 Descarga el reporte CSV iterando dinámicamente sobre los filtros (Soporta múltiples por comas)
   */

  public exportDashboardData(endpoint: string, filters?: any): Observable<Blob> {
    let queryParams = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];

        if (value && value !== 'Todos' && value !== 'Todas') {
          let backendKey = key;
          
          // Traducciones
          if (key === 'agencia' && endpoint.includes('forms')) {
              backendKey = 'agency'; 
          } else if (key === 'startDate') {
              backendKey = 'fechaInicio';
          } else if (key === 'endDate') {
              backendKey = 'fechaFin';
          }

          // 🚀 AQUÍ ESTÁ LA MAGIA: Si es un arreglo (múltiples agencias), las unimos por comas
          if (Array.isArray(value)) {
            const stringArray = value.filter(v => v !== '').join(',');
            if (stringArray) {
              queryParams = queryParams.set(backendKey, stringArray);
            }
          } else {
            queryParams = queryParams.set(backendKey, value);
          }
        }
      });
    }

    return this.http.get(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
      params: queryParams,
      responseType: 'blob' 
    });
  }

  /**
   * 📤 Sube un archivo genérico a un endpoint, soportando datos extra (como fechaCorte)
   */
  public uploadDashboardData(endpoint: string, file: File, extraPayload?: any): Observable<any> {
    const formData = new FormData();
    
    // 1. Adjuntamos el archivo. 
    // IMPORTANTE: El backend espera que este campo se llame exactamente 'file'
    formData.append('file', file, file.name);

    // 2. Adjuntamos dinámicamente cualquier otro dato que necesite el backend
    if (extraPayload) {
      Object.keys(extraPayload).forEach(key => {
        // FormData solo acepta strings o blobs, así que convertimos los valores
        formData.append(key, String(extraPayload[key]));
      });
    }

    // 3. Generamos los headers (SIN Content-Type, el navegador lo calcula automático)
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.baseUrl}${endpoint}`, formData, { headers });
  }

}