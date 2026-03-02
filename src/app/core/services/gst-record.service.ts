import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { GstRecord } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GstRecordService extends ApiService<GstRecord> {
  protected override endpoint = 'gst-records';

  /**
   * Generate GST records for all active clients in a given month/year.
   * Creates the period if it doesn't exist.
   */
  generateRecords(month: string, financialYear: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/generate`, {
      month,
      financial_year: financialYear
    }).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }
}
