import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// 🛡️ Ajusta las rutas relativas según la ubicación real de tus archivos
import { environment } from '../../../environments/environment'; 
import { Auth } from '../auth/auth'; 

@Injectable({
  providedIn: 'root'
})
export class OrganizationsService {

  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * 🏢 Trae la jerarquía de Regiones -> Agencias desde el backend
   * Ajusta la ruta "/organizations/hierarchy" si tu enrutador principal usa otro prefijo (ej: "/api/organizations/hierarchy")
   */
  public getOrgHierarchy(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/organizations/hierarchy`, {
      headers: this.getHeaders()
    });
  }
}