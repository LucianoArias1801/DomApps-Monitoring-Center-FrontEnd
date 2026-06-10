import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  
  private baseUrl = environment.apiUrl;
  private authStatus = new BehaviorSubject<boolean>(this.isAuthenticated());

  constructor(private http: HttpClient) { }

  public login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('domapps_token', response.token);
          localStorage.setItem('domapps_user', JSON.stringify(response.user));
          this.authStatus.next(true);
        }
      })
    );
  }

  public getUserData(): any | null {
    const user = localStorage.getItem('domapps_user');
    return user ? JSON.parse(user) : null;
  }

  public getToken(): string | null {
    return localStorage.getItem('domapps_token');
  }

  public isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  public getAuthStatus(): Observable<boolean> {
    return this.authStatus.asObservable();
  }

  public logout(): void {
    localStorage.removeItem('domapps_token');
    localStorage.removeItem('domapps_user');
    this.authStatus.next(false);
  }
}