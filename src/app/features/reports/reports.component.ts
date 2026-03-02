import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GstRecordService } from '../../core/services/gst-record.service';
import { ClientService } from '../../core/services/client.service';
import { LoadingService } from '../../core/services/loading.service';
import { forkJoin } from 'rxjs';
import { GstRecord, Client } from '../../core/models';
import { exportToCsv } from '../../shared/utils/csv-export.util';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';

export type ReportType = 'filing-summary' | 'tax-liability' | 'staff-performance';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule,
    MatSelectModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule,
    MatIconModule, MatProgressSpinnerModule, DataTableComponent
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit {
  private gstRecordService = inject(GstRecordService);
  private clientService = inject(ClientService);
  private loadingService = inject(LoadingService);

  reportForm = new FormGroup({
    type: new FormControl<ReportType>('filing-summary', [Validators.required]),
    startDate: new FormControl<Date | null>(null),
    endDate: new FormControl<Date | null>(null)
  });

  isLoading = this.loadingService.isLoading;
  previewData = signal<any[]>([]);
  columnConfig = signal<TableColumn[]>([]);
  reportTitle = signal<string>('');

  ngOnInit(): void {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);

    this.reportForm.patchValue({
      startDate: start,
      endDate: end
    });
  }

  generateReport(): void {
    if (this.reportForm.invalid) return;

    this.loadingService.show();
    const { type, startDate, endDate } = this.reportForm.value;

    forkJoin({
      returns: this.gstRecordService.getPaginated(1, 10000),
      clients: this.clientService.getPaginated(1, 1000)
    }).subscribe({
      next: ({ returns, clients }) => {
        const filteredReturns = this.filterByDate(returns.items, startDate, endDate);

        switch (type) {
          case 'filing-summary':
            this.generateFilingSummary(filteredReturns);
            break;
          case 'tax-liability':
            this.generateTaxLiability(filteredReturns, clients.items);
            break;
          case 'staff-performance':
            this.generateStaffPerformance(filteredReturns);
            break;
        }
        this.loadingService.hide();
      },
      error: () => this.loadingService.hide()
    });
  }

  private filterByDate(records: GstRecord[], start: Date | null | undefined, end: Date | null | undefined): GstRecord[] {
    return records;
  }

  private generateFilingSummary(records: GstRecord[]): void {
    this.reportTitle.set('Filing Summary Report');
    this.columnConfig.set([
      { key: 'period', label: 'Period' },
      { key: 'gstr1_filed', label: 'GSTR-1 Filed' },
      { key: 'gstr1_pending', label: 'GSTR-1 Pending' },
      { key: 'gstr3b_filed', label: 'GSTR-3B Filed' },
      { key: 'gstr3b_pending', label: 'GSTR-3B Pending' }
    ]);

    const summaryMap = new Map<string, any>();

    records.forEach(r => {
      const key = `${r.month}_${r.financial_year}`;
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          period: `${r.month} ${r.financial_year}`,
          gstr1_filed: 0, gstr1_pending: 0,
          gstr3b_filed: 0, gstr3b_pending: 0
        });
      }
      const entry = summaryMap.get(key);
      if (r.gstr1_status === 'filed') entry.gstr1_filed++;
      else entry.gstr1_pending++;

      if (r.gstr3b_status === 'filed') entry.gstr3b_filed++;
      else entry.gstr3b_pending++;
    });

    this.previewData.set(Array.from(summaryMap.values()));
  }

  private generateTaxLiability(records: GstRecord[], clients: Client[]): void {
    this.reportTitle.set('Client Tax Liability Report');
    this.columnConfig.set([
      { key: 'client_name', label: 'Client' },
      { key: 'gstin', label: 'GSTIN' },
      { key: 'total_returns', label: 'Total Returns' },
      { key: 'gstr1_filed', label: 'GSTR-1 Filed' },
      { key: 'gstr1_pending', label: 'GSTR-1 Pending' },
      { key: 'gstr3b_filed', label: 'GSTR-3B Filed' },
      { key: 'gstr3b_pending', label: 'GSTR-3B Pending' }
    ]);

    const clientMap = new Map<string, any>();

    records.forEach((r: any) => {
      const key = r.client_id;
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          client_name: r.client_name || 'Unknown',
          gstin: r.gstin || '-',
          total_returns: 0,
          gstr1_filed: 0, gstr1_pending: 0,
          gstr3b_filed: 0, gstr3b_pending: 0
        });
      }
      const entry = clientMap.get(key);
      entry.total_returns++;
      if (r.gstr1_status === 'filed') entry.gstr1_filed++;
      else entry.gstr1_pending++;
      if (r.gstr3b_status === 'filed') entry.gstr3b_filed++;
      else entry.gstr3b_pending++;
    });

    this.previewData.set(Array.from(clientMap.values()));
  }

  private generateStaffPerformance(records: GstRecord[]): void {
    this.reportTitle.set('Staff Performance Report');
    this.columnConfig.set([
      { key: 'staff_name', label: 'Staff Member' },
      { key: 'assigned', label: 'Assigned' },
      { key: 'filed', label: 'Filed' },
      { key: 'pending', label: 'Pending' },
      { key: 'filing_rate', label: 'Filing Rate (%)' }
    ]);

    const staffMap = new Map<string, any>();

    records.forEach((r: any) => {
      const key = r.assigned_to || 'unassigned';
      const name = r.assigned_to_name || 'Unassigned';
      if (!staffMap.has(key)) {
        staffMap.set(key, {
          staff_name: name,
          assigned: 0,
          filed: 0,
          pending: 0,
          filing_rate: '0'
        });
      }
      const entry = staffMap.get(key);
      entry.assigned++;
      // Count as filed if BOTH gstr1 and gstr3b are filed
      if (r.gstr1_status === 'filed' && r.gstr3b_status === 'filed') {
        entry.filed++;
      } else {
        entry.pending++;
      }
      entry.filing_rate = entry.assigned > 0
        ? ((entry.filed / entry.assigned) * 100).toFixed(1)
        : '0';
    });

    this.previewData.set(Array.from(staffMap.values()));
  }

  exportReport(): void {
    const data = this.previewData();
    if (!data.length) return;

    const fileName = `${this.reportTitle().replace(/\s+/g, '_').toLowerCase()}_${new Date().getTime()}.csv`;
    exportToCsv(fileName, data);
  }
}
