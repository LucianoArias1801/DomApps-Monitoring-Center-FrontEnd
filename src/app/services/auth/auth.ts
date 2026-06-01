import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  public login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('domapps_token', response.token);
          localStorage.setItem('domapps_user', JSON.stringify(response.user));
        }
      })
    );
  }

  public getUserData(): any | null {
    const user = localStorage.getItem('domapps_user');
    return user ? JSON.parse(user) : null;
  }

  // 🚀 CORREGIDO: Volvemos a buscar tu variable exacta
  public getToken(): string | null {
    return localStorage.getItem('domapps_token');
  }

  public isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  // 🚀 CORREGIDO: Borramos tus variables exactas
  public logout(): void {
    localStorage.removeItem('domapps_token');
    localStorage.removeItem('domapps_user');
  }
}