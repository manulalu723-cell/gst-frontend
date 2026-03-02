import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: any;
}

@Injectable()
export abstract class ApiService<T extends { id: string | number }> {
  protected http = inject(HttpClient);
  protected abstract endpoint: string; // e.g., 'clients', 'returns'

  protected get baseUrl(): string {
    return `${environment.apiUrl}/${this.endpoint}`;
  }

  /**
   * Retrieves paginated data using standard query parameters.
   */
  getPaginated(
    page: number = 1,
    limit: number = 10,
    searchTerm: string = '',
    filters: any = {}
  ): Observable<PaginatedResult<T>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (searchTerm) {
      params = params.set('q', searchTerm);
    }

    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    // Add cache buster
    params = params.set('_t', new Date().getTime().toString());

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(res => {
        const data = res.data ?? res;
        // Handle both old format (data is array) and new format (data is {items, total})
        if (Array.isArray(data)) {
          return { items: data, total: data.length };
        }
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Standard GET by ID
   */
  getById(id: string | number): Observable<T> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * Standard POST
   */
  create(item: Partial<T>): Observable<T> {
    return this.http.post<any>(this.baseUrl, item).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * Standard PUT
   */
  update(id: string | number, item: Partial<T>): Observable<T> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, item).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * Standard DELETE
   */
  delete(id: string | number): Observable<boolean> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`).pipe(
      map(() => true),
      catchError(this.handleError)
    );
  }

  /**
   * Standard Bulk Update
   */
  bulkUpdate(items: Partial<T>[]): Observable<boolean> {
    // Standard approach: POST to /bulk or PATCH to collection
    return this.http.post<any>(`${this.baseUrl}/bulk`, { items }).pipe(
      map(() => true),
      catchError(this.handleError)
    );
  }

  /**
   * Helper for error handling
   */
  protected handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => ({ message: errorMessage, code: error.status.toString() }));
  }

  // --- Mock Helpers (To be removed when real API is ready) ---

  /**
   * Maintains existing mock behavior using the current JSON endpoints 
   * but structured within the new service architecture.
   */
  private mockGetPaginated(page: number, limit: number, searchTerm: string, filters: any): Observable<PaginatedResult<T>> {
    // Map clean internal endpoint to local asset path
    const mockPath = `/assets/mock-data/${this.endpoint}.json`;

    return this.http.get<T[]>(mockPath).pipe(
      delay(500),
      map(data => {
        let filteredData = data;
        if (Object.keys(filters).length > 0) {
          filteredData = filteredData.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
              const itemValue = (item as any)[key];
              if (itemValue === undefined || itemValue === null) return false;
              if (value === undefined || value === null || value === '') return true;
              return String(itemValue).toLowerCase() === String(value).toLowerCase();
            });
          });
        }

        if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          filteredData = filteredData.filter(item => {
            return Object.values(item).some(val =>
              typeof val === 'string' && val.toLowerCase().includes(lowerTerm)
            );
          });
        }

        const start = (page - 1) * limit;
        const end = start + limit;
        return {
          items: filteredData.slice(start, end),
          total: filteredData.length,
          page,
          limit
        };
      })
    );
  }
}
