import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment'; // Importamos el environment para usar la URL base y la API key

// 1. Importamos la clase de Autenticación para obtener el token
import { Auth } from '../auth/auth'; 

// 2. Importamos todas las interfaces estrictas que definimos en la Fase 1
import { 
  FormTemplate, 
  FormStructureResponse,
  FormSubmitPayload
} from '../../models/dynamic-forms.model';

@Injectable({
  providedIn: 'root'
})
export class DynamicFormsService {

  // Domain base de tu API de Node.js
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) { }

  /**
   * Genera los cabeceros HTTP inyectando el Token JWT de seguridad de forma centralizada.
   */
  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ==========================================================================
  // BLOQUE 1: ESTRUCTURA Y CONFIGURACIÓN (Visto en la Parte 1)
  // ==========================================================================

  /**
   * Obtiene todos los formatos disponibles en el sistema.
   * GET /forms
   */
  public getTemplates(): Observable<FormTemplate[]> {
    return this.http.get<FormTemplate[]>(`${this.baseUrl}/forms`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene la estructura (preguntas y tipos) para dibujar la UI dinámicamente.
   * GET /forms/:templateId/structure
   */
  public getFormStructure(templateId: number): Observable<FormStructureResponse> {
    return this.http.get<FormStructureResponse>(`${this.baseUrl}/forms/${templateId}/structure`, {
      headers: this.getHeaders()
    });
  }

  // ==========================================================================
  // BLOQUE 2: OPERACIONES DE DATOS (CRUD UNIVERSAL)
  // ==========================================================================

  /**
   * Obtiene los registros guardados (la bitácora) de un formulario específico.
   * Soporta parámetros opcionales de búsqueda para cuando implementemos los filtros.
   * GET /forms/:templateId/records
   */
  public getFormRecords(templateId: number, filters?: any): Observable<any[]> {
    let queryParams = new HttpParams();

    // 1. Limpiamos los filtros (ignoramos nulos y la palabra "Todas")
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'Todos' && filters[key] !== 'Todas') {
          queryParams = queryParams.set(key, filters[key]);
        }
      });
    }

    // 2. 🚀 RESTAURAMOS TU RUTA EXACTA Y TUS CABECERAS
    return this.http.get<any[]>(`${this.baseUrl}/forms/${templateId}/records`, {
      headers: this.getHeaders(),
      params: queryParams 
    });
  }

  /**
   * Guarda un nuevo registro (monitoreo o auditoría) en la base de datos usando el patrón EAV.
   * POST /forms/submit
   */
  public submitForm(payload: FormSubmitPayload): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/forms/submit`, payload, {
      headers: this.getHeaders()
    });
  }

  /**
   * Reemplaza todas las respuestas de un registro específico en la base de datos.
   * PUT /forms/:templateId/records/:recordId
   */
  public updateFormRecord(templateId: number, recordId: number | string, payload: { answers: any[] }): Observable<any> {
    return this.http.put<any>(`${`${this.baseUrl}/forms/${templateId}/records/${recordId}`}`, payload, {
      headers: this.getHeaders()
    });
  }

  /**
   * Incrementa exclusivamente la cantidad de un registro específico de forma optimizada.
   * PATCH /forms/:templateId/records/:recordId/increment
   */
  public incrementEventQuantity(templateId: number, recordId: number | string): Observable<any> {
    return this.http.patch<any>(`${`${this.baseUrl}/forms/${templateId}/records/${recordId}/increment`}`, {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * Elimina de forma lógica un registro ocultándolo del histórico.
   * DELETE /forms/:templateId/records/:recordId
   */
  public deleteFormRecord(templateId: number, recordId: number | string): Observable<any> {
    return this.http.delete<any>(`${`${this.baseUrl}/forms/${templateId}/records/${recordId}`}`, {
      headers: this.getHeaders()
    });
  }

  // ==========================================================================
  // BLOQUE 3: CATÁLOGOS AUXILIARES (VEHÍCULOS Y ORGANIZACIÓN)
  // ==========================================================================

  /**
   * Buscador dinámico de vehículos (Autocompletado).
   * Filtra por ECO o Placa buscando en las tablas de vehículos reales de tu MySQL.
   * GET /vehicles/select-options?q=2021
   */
  public searchVehicles(term: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/vehicles/select-options`, {
      headers: this.getHeaders(),
      params: { q: term }
    });
  }

  /**
   * Obtiene la estructura completa de Regiones y Agencias activas en el sistema.
   * GET /vehicles/regions-agencies
   */
  public getRegionsAndAgencies(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/vehicles/regions-agencies`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Busca vehículos en tiempo real por ECO en la base de datos
   * Conecta con la ruta oficial: GET /api/vehicles/actuales/eco/:eco
   */
  public searchVehiclesByEco(eco: string): Observable<any> {
    const token = this.auth.getToken(); 
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // 🚀 Corregimos la ruta apuntando a "actuales/eco" como dicta tu PDF de la API
    return this.http.get<any>(`${this.baseUrl}/vehicles/actuales/eco/${eco}`, { headers });
  }

  /**
   * Busca vehículos en MIX por placa
   * Conecta con GET /api/vehicles/mix/placa/:placa
   */
  public searchMixVehicleByPlaca(placa: string): Observable<any> {
    const token = this.auth.getToken(); 
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.get<any>(`${this.baseUrl}/vehicles/mix/placa/${placa}`, { headers });
  }

  /**
   * Solicita al backend la compilación completa de un CSV histórico considerando los filtros aplicados.
   * Retorna un Observable de tipo Blob para manipulación binaria segura.
   */
  public downloadFormRecordsCSV(templateId: number, filters?: any): Observable<Blob> {
    let queryParams = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'Todos' && filters[key] !== 'Todas') {
          queryParams = queryParams.set(key, filters[key]);
        }
      });
    }

    // Apuntamos a la nueva ruta inyectando cabeceras JWT y declarando que la respuesta es un Blob binario
    return this.http.get(`${this.baseUrl}/forms/${templateId}/export-csv`, {
      headers: this.getHeaders(),
      params: queryParams,
      responseType: 'blob' 
    });
  }
}