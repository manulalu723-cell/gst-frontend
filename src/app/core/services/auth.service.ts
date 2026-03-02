import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { User } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'jwt_token';
  private readonly USER_KEY = 'user_info';
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  // Signals for reactive state
  readonly isLoggedIn = signal<boolean>(this.hasToken());
  readonly currentUser = signal<User | null>(this.getStoredUser());

  constructor(private router: Router, private http: HttpClient) { }

  login(email: string, password: string): Observable<{ token: string; user: User }> {
    return this.http.post<any>(`${this.baseUrl}/login`, { email, password }).pipe(
      map(res => {
        const { token, user } = res.data;
        // Map backend lowercase role to frontend PascalCase
        const mappedUser: User = {
          ...user,
          role: user.role === 'admin' ? 'Admin' : 'Staff',
          active: true // Backend doesn't have active but UI expects it
        };
        return { token, user: mappedUser };
      }),
      tap(res => this.handleAuthSuccess(res.token, res.user))
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private handleAuthSuccess(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.isLoggedIn.set(true);
    this.currentUser.set(user);
  }
}
