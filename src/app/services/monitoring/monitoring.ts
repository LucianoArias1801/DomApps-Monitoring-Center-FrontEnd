import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from '../auth/auth'; // Asegúrate de que la ruta apunte a tu servicio Auth

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {

  private baseUrl = 'http://localhost:3000/api';
  private templateId = 2; // El ID para Monitoreo según tu documentación [cite: 35, 38, 47, 84]

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) { }

  /**
   * Genera los cabeceros con el token JWT activo
   */
  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Petición GET al endpoint de registros
   * Trae el historial de la bitácora de monitoreo
   */
  public getMonitoringRecords(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/forms/${this.templateId}/records`, {
      headers: this.getHeaders()
    });
  }

  public getUnitsCatalog(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/units`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Buscador dinámico de vehículos (Apunta al nuevo endpoint optimizado)
   */
  public searchVehicles(term: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/vehicles/select-options?q=${term}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene la estructura y opciones de los selectores de un formulario
   */
  public getFormStructure(templateId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/forms/${templateId}/structure`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Envía el payload completo para guardar un nuevo registro en la base de datos
   * Apunta al endpoint POST /forms/submit
   */
  public submitForm(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/forms/submit`, payload, {
      headers: this.getHeaders() // Asegúrate de enviar el token de autorización
    });
  }

  /**
   * Obtiene los registros llenos de un formulario específico
   */
  public getFormRecords(templateId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/forms/${templateId}/records`, {
      headers: this.getHeaders()
    });
  }

  // Arriba en el archivo debes tener importado HttpHeaders:
  // import { HttpClient, HttpHeaders } from '@angular/common/http';

  public incrementEventQuantity(templateID: number, recordId: number | string) {
    const url = `${this.baseUrl}/forms/${templateID}/records/${recordId}/increment`;
    
    // Usamos tu servicio de Auth para traer el token
    const token = this.auth.getToken(); // O como se llame la función en tu proyecto
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.patch(url, {}, { headers });
  }

  /**
   * Actualiza un registro completo en la base de datos
   * @param templateID ID del formulario (Ej: 2 para Alertas)
   * @param recordId ID del registro a modificar
   * @param payload Objeto con las respuestas { answers: [...] }
   */
  public updateFormRecord(templateID: number, recordId: number | string, payload: any) {
    const url = `${this.baseUrl}/forms/${templateID}/records/${recordId}`;
    
    // Extraemos el token para el guardia de seguridad
    const token = this.auth.getToken(); 
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Enviamos un PUT con el payload y los headers
    return this.http.put(url, payload, { headers });
  }

  
}