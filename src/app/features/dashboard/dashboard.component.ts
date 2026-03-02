import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import { ClientService } from '../../core/services/client.service';
import { GstRecordService } from '../../core/services/gst-record.service';
import { StaffService } from '../../core/services/staff.service';
import { LoadingService } from '../../core/services/loading.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { GstRecord } from '../../core/models';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    SkeletonComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('monthlyChart') monthlyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('workloadChart') workloadChartRef!: ElementRef<HTMLCanvasElement>;

  private clientService = inject(ClientService);
  private gstRecordService = inject(GstRecordService);
  private staffService = inject(StaffService);
  private loadingService = inject(LoadingService);
  private destroy$ = new Subject<void>();

  private monthlyChartInstance: Chart | null = null;
  private workloadChartInstance: Chart | null = null;

  isLoading = this.loadingService.isLoading;

  // Stats signals
  totalClients = signal<number>(0);
  returnsThisMonth = signal<number>(0);
  filedReturns = signal<number>(0);
  pendingReturns = signal<number>(0);
  overdueReturns = signal<number>(0);

  // Data storage for calculations
  private allReturns: GstRecord[] = [];
  private staffMap = new Map<string, string>();

  ngOnInit(): void {
    this.loadingService.show();

    forkJoin({
      clientsRes: this.clientService.getPaginated(1, 1),
      returnsRes: this.gstRecordService.getPaginated(1, 10000),
      staffRes: this.staffService.getPaginated(1, 100)
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ clientsRes, returnsRes, staffRes }) => {
        // Build staff name map
        staffRes.items.forEach(s => {
          this.staffMap.set(s.id, s.name || s.email);
        });

        this.allReturns = returnsRes.items;
        this.totalClients.set(clientsRes.total);

        this.calculateReturnStats(this.allReturns);
        this.loadingService.hide();

        // Let the view update before initializing charts
        setTimeout(() => this.initCharts(), 0);
      },
      error: () => this.loadingService.hide()
    });
  }

  private calculateReturnStats(records: GstRecord[]): void {
    let filed = 0;
    let pending = 0;
    let overdue = 0;
    let thisMonthCount = 0;

    const today = new Date();
    const currentMonthIndex = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthName = months[currentMonthIndex];

    // Quick helper to see if a month string is "before" current month
    const isPastPeriod = (monthStr: string, fyStr: string) => {
      // Basic FY logic: 2025-2026. Assuming Jan-Mar is the 'end' year, Apr-Dec is 'start' year.
      if (!monthStr || !fyStr) return false;
      const mIdx = months.indexOf(monthStr);
      if (mIdx === -1) return false;

      const parts = fyStr.split('-');
      if (parts.length !== 2) return false;

      // Realistically we can just check if it's strictly not the current month/year and not a future one
      // For simplicity in a dashboard, if month != currentMonthName, it's overdue (if pending)
      return true;
    };

    records.forEach((r: any) => {
      const isFiled = r.gstr1_status === 'filed' && r.gstr3b_status === 'filed';
      if (isFiled) {
        filed++;
      } else {
        pending++;
        // If not filed and it's from a previous period, mark overdue
        if (r.month !== currentMonthName) {
          overdue++;
        }
      }

      if (r.month === currentMonthName && r.financial_year?.includes(currentYear.toString())) {
        thisMonthCount++;
      }
    });

    this.filedReturns.set(filed);
    this.pendingReturns.set(pending);
    this.overdueReturns.set(overdue);
    this.returnsThisMonth.set(thisMonthCount);
  }

  ngAfterViewInit(): void {
    // Canvas elements available here, but we wait for data
  }

  private initCharts(): void {
    if (!this.monthlyChartRef || !this.workloadChartRef) return;

    this.renderMonthlyChart();
    this.renderWorkloadChart();
  }

  private renderMonthlyChart(): void {
    const ctx = this.monthlyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.monthlyChartInstance) {
      this.monthlyChartInstance.destroy();
    }

    const periodMap = new Map<string, { filed: number, pending: number }>();

    this.allReturns.forEach(r => {
      const p = `${r.month} ${r.financial_year}`;
      if (!periodMap.has(p)) {
        periodMap.set(p, { filed: 0, pending: 0 });
      }

      const entry = periodMap.get(p)!;
      if (r.gstr1_status === 'filed' && r.gstr3b_status === 'filed') {
        entry.filed++;
      } else {
        entry.pending++;
      }
    });

    const sortedPeriods = Array.from(periodMap.keys()).sort().slice(-6);
    const labels = sortedPeriods;
    const filedData = sortedPeriods.map(p => periodMap.get(p)!.filed);
    const pendingData = sortedPeriods.map(p => periodMap.get(p)!.pending);

    this.monthlyChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Filed',
            data: filedData,
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
            borderColor: 'rgba(76, 175, 80, 1)',
            borderWidth: 1
          },
          {
            label: 'Pending/Overdue',
            data: pendingData,
            backgroundColor: 'rgba(255, 152, 0, 0.7)',
            borderColor: 'rgba(255, 152, 0, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true }
        }
      }
    });
  }

  private renderWorkloadChart(): void {
    const ctx = this.workloadChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.workloadChartInstance) {
      this.workloadChartInstance.destroy();
    }

    const workloadMap = new Map<string, number>();

    this.allReturns.forEach((r: any) => {
      const isPending = r.gstr1_status !== 'filed' || r.gstr3b_status !== 'filed';
      if (isPending) {
        const staffId = r.assigned_to || 'unassigned';
        const count = workloadMap.get(staffId) || 0;
        workloadMap.set(staffId, count + 1);
      }
    });

    const labels: string[] = [];
    const data: number[] = [];

    workloadMap.forEach((count, staffId) => {
      const name = staffId === 'unassigned' ? 'Unassigned' : (this.staffMap.get(staffId) || 'Unknown');
      labels.push(name);
      data.push(count);
    });

    const backgroundColors = [
      '#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#EC407A', '#26C6DA', '#FFCA28'
    ];

    this.workloadChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['No Pending Work'],
        datasets: [{
          data: data.length ? data : [0],
          backgroundColor: data.length ? backgroundColors : ['#f5f5f5'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' }
        },
        cutout: '70%'
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.monthlyChartInstance) {
      this.monthlyChartInstance.destroy();
    }
    if (this.workloadChartInstance) {
      this.workloadChartInstance.destroy();
    }
  }
}
