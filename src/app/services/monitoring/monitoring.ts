// ? ==========================================================================
// ? 1. SERVICIO DE INTEGRACIÓN (MOCK) - EVENTOS DE MONITOREO
// ? ==========================================================================
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

//* Contrato estricto basado en tu Excel y Wireframe
export interface FleetEvent {
  id: string;
  proveedor: string;
  conceptoUnidad: string;
  statusMix: string;
  tipoAlerta: string;
  status: string;
  fecha: string;
  plataforma: string;
  region: string;
  agencia: string;
  eco: string;
  matricula: string;
  posicion: string;
  cantidad: number;
  comentario: string;
}

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {

  constructor() { }

  // ? ==========================================================================
  // ? 2. ENDPOINTS SIMULADOS
  // ? ==========================================================================

  //* Obtiene la bitácora inicial de eventos
  getLiveEvents(): Observable<FleetEvent[]> {
    const mockData: FleetEvent[] = [
      {
        id: 'EV-1001', proveedor: 'Traffilog', conceptoUnidad: 'VD95893- 3332 Norte Hermosillo ISUZU ELF 400',
        statusMix: 'ACCIONADO', tipoAlerta: 'CIERRE DE OJOS', status: 'WH', fecha: '01/05/2026 01:25 PM',
        plataforma: 'Traffilog', region: 'Norte', agencia: 'Hermosillo', eco: '3332',
        matricula: 'VD95893', posicion: 'Lat: 29.08, Lng: -110.95', cantidad: 1, comentario: 'Operador presenta fatiga'
      },
      {
        id: 'EV-1002', proveedor: 'PF', conceptoUnidad: 'JW49604- 3807 Centro Guadalajara VOLKSWAGEN SAVEIRO',
        statusMix: 'ACCIONADO', tipoAlerta: 'CINTURON', status: 'AF', fecha: '01/05/2026 02:39 PM',
        plataforma: 'PF', region: 'Centro', agencia: 'Guadalajara', eco: '3807',
        matricula: 'JW49604', posicion: 'Lat: 20.65, Lng: -103.34', cantidad: 3, comentario: 'Operador detenido sin cinturón'
      }
    ];

    // 3. Simulamos 800ms de tiempo de respuesta de red
    return of(mockData).pipe(delay(800));
  }
}