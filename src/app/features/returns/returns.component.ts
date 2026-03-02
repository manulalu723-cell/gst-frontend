import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { GstRecordService } from '../../core/services/gst-record.service';
import { StaffService } from '../../core/services/staff.service';
import { PeriodService } from '../../core/services/period.service';
import { LoadingService } from '../../core/services/loading.service';
import { GstRecord, Period, User } from '../../core/models';
import { ReturnsDrawerComponent } from './returns-drawer/returns-drawer';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterConfig } from '../../shared/components/filter-panel/filter-panel.component';
import { environment } from '../../../environments/environment';

type ViewMode = 'default' | 'gstr1' | 'gstr3b' | 'billing';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCheckboxModule, MatButtonModule,
    MatIconModule, MatCardModule, MatSidenavModule, MatSnackBarModule,
    MatFormFieldModule, MatSelectModule, MatButtonToggleModule,
    ReturnsDrawerComponent, DataTableComponent, FilterPanelComponent
  ],
  templateUrl: './returns.html',
  styleUrl: './returns.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReturnsComponent implements OnInit {
  private gstRecordService = inject(GstRecordService);
  private staffService = inject(StaffService);
  private periodService = inject(PeriodService);
  private loadingService = inject(LoadingService);
  private snackBar = inject(MatSnackBar);
  private http = inject(HttpClient);

  returns = signal<GstRecord[]>([]);
  totalReturns = signal<number>(0);
  isLoading = this.loadingService.isLoading;
  isSubmitting = signal(false);
  staffList = signal<User[]>([]);
  periods = signal<Period[]>([]);

  selectedMonth = '';
  selectedYear = '';
  showGeneratePanel = signal(false);
  statusOptions = signal<{ value: string; label: string }[]>([]);

  selection = new SelectionModel<GstRecord>(true, []);
  pageIndex = 0;
  pageSize = 50;
  currentFilters: any = {};

  isDrawerOpen = signal(false);
  selectedReturn: GstRecord | null = null;

  bulkStaffCtrl = new FormControl('');
  bulkStatusCtrl = new FormControl('');

  currentView = signal<ViewMode>('default');

  columnConfigs: Record<ViewMode, TableColumn[]> = {
    default: [
      { key: 'select', label: '', template: true },
      { key: 'client_name', label: 'Client Name' },
      { key: 'period', label: 'Period', template: true },
      { key: 'gstr1_status', label: 'GSTR-1', template: true },
      { key: 'gstr3b_status', label: 'GSTR-3B', template: true },
      { key: 'remarks', label: 'Remarks' },
      { key: 'actions', label: 'Actions', template: true }
    ],
    gstr1: [
      { key: 'select', label: '', template: true },
      { key: 'client_name', label: 'Client Name' },
      { key: 'gstr1_status', label: 'Status', template: true },
      { key: 'gstr1_filed_date', label: 'Filed Date', template: true },
      { key: 'gstr1_tally_received', label: 'Tally Rcvd' },
      { key: 'gstr1_entered_in_tally', label: 'Tally Entered', template: true },
      { key: 'gstr1_nil_return', label: 'Nil Return', template: true },
      { key: 'gstr1_comments', label: 'Comments' },
      { key: 'actions', label: 'Actions', template: true }
    ],
    gstr3b: [
      { key: 'select', label: '', template: true },
      { key: 'client_name', label: 'Client Name' },
      { key: 'gstr3b_status', label: 'Status', template: true },
      { key: 'gstr3b_filed_date', label: 'Filed Date', template: true },
      { key: 'gstr3b_tally_received', label: 'Tally Rcvd' },
      { key: 'gstr3b_entered_in_tally', label: 'Tally Entered', template: true },
      { key: 'gstr3b_reconciliation', label: 'Recon.' },
      { key: 'gstr3b_notices_orders', label: 'Notices/Orders', template: true },
      { key: 'gstr3b_tax_liability', label: 'Liability' },
      { key: 'gstr3b_nil_return', label: 'Nil Return', template: true },
      { key: 'gstr3b_bills_pending', label: 'Bills Pndg', template: true },
      { key: 'gstr3b_comments', label: 'Comments' },
      { key: 'actions', label: 'Actions', template: true }
    ],
    billing: [
      { key: 'select', label: '', template: true },
      { key: 'client_name', label: 'Client Name' },
      { key: 'billing_status', label: 'Billing Status' },
      { key: 'bill_sent', label: 'Bill Sent', template: true },
      { key: 'gstr1a_applicable', label: 'GSTR1A Y/N', template: true },
      { key: 'actions', label: 'Actions', template: true }
    ]
  };

  get currentColumns(): TableColumn[] {
    return this.columnConfigs[this.currentView()] || this.columnConfigs['default'];
  }

  changeView(view: ViewMode) {
    this.currentView.set(view);
  }

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Search Clients', type: 'text', icon: 'search', placeholder: 'Name or GSTIN' },
    {
      key: 'month', label: 'Month', type: 'select', options: [
        { value: 'January', label: 'January' },
        { value: 'February', label: 'February' },
        { value: 'March', label: 'March' },
        { value: 'April', label: 'April' },
        { value: 'May', label: 'May' },
        { value: 'June', label: 'June' },
        { value: 'July', label: 'July' },
        { value: 'August', label: 'August' },
        { value: 'September', label: 'September' },
        { value: 'October', label: 'October' },
        { value: 'November', label: 'November' },
        { value: 'December', label: 'December' }
      ]
    },
    {
      key: 'financial_year', label: 'Year', type: 'select', options: [
        { value: '2023-24', label: '2023-24' },
        { value: '2024-25', label: '2024-25' }
      ]
    },
    {
      key: 'type', label: 'Return Type', type: 'select', options: [
        { value: 'GSTR-1', label: 'GSTR-1' },
        { value: 'GSTR-3B', label: 'GSTR-3B' },
        { value: 'GSTR-9', label: 'GSTR-9' },
        { value: 'IFF', label: 'IFF' }
      ]
    },
    {
      key: 'status', label: 'Status', type: 'select', options: [] // Populated from settings API
    },
    { key: 'assignedTo', label: 'Staff', type: 'select', options: [] } // Options populated in loadStaff
  ];

  ngOnInit(): void {
    this.loadStaff();
    this.loadPeriods();
    this.loadStatuses();
    this.loadReturns();
  }

  loadStaff(): void {
    this.staffService.getPaginated(1, 100).subscribe({
      next: (res) => {
        this.staffList.set(res.items);
        const staffOptions = res.items.map(s => ({ value: s.id, label: s.name || s.email }));
        const staffConfig = this.filterConfig.find(c => c.key === 'assignedTo');
        if (staffConfig) staffConfig.options = staffOptions;
      }
    });
  }

  loadPeriods(): void {
    this.periodService.getPaginated(1, 100).subscribe({
      next: (res) => {
        this.periods.set(res?.items || []);
      }
    });
  }

  loadStatuses(): void {
    this.http.get<any>(`${environment.apiUrl}/settings?key=gst_status`).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        const opts = items.map((s: any) => ({
          value: s.value,
          label: s.value.charAt(0).toUpperCase() + s.value.slice(1).replace('-', ' ')
        }));
        this.statusOptions.set(opts);

        // Update the filter config
        const statusConfig = this.filterConfig.find(c => c.key === 'status');
        if (statusConfig) statusConfig.options = opts;
      }
    });
  }

  generateReturns(): void {
    if (!this.selectedMonth || !this.selectedYear) {
      this.snackBar.open('Please select both month and year', 'Close', { duration: 3000 });
      return;
    }

    this.loadingService.show();
    this.gstRecordService.generateRecords(this.selectedMonth, this.selectedYear).subscribe({
      next: (data) => {
        this.snackBar.open(
          `${data.message}`,
          'Close', { duration: 5000 }
        );
        this.showGeneratePanel.set(false);
        this.loadPeriods();
        this.loadReturns();
        this.loadingService.hide();
      },
      error: (err) => {
        this.snackBar.open(err.message || 'Failed to generate records', 'Close', { duration: 5000 });
        this.loadingService.hide();
      }
    });
  }

  loadReturns(): void {
    this.loadingService.show();
    const { search, ...filters } = this.currentFilters;

    this.gstRecordService.getPaginated(
      this.pageIndex + 1,
      this.pageSize,
      search || '',
      filters
    ).subscribe({
      next: (res) => {
        this.returns.set(res.items);
        this.totalReturns.set(res.total);
        this.loadingService.hide();
      },
      error: () => this.loadingService.hide()
    });
  }

  onFilterChanged(filters: any): void {
    this.currentFilters = filters;
    this.pageIndex = 0;
    this.selection.clear();
    this.loadReturns();
  }

  onPageChanged(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.selection.clear();
    this.loadReturns();
  }

  // --- Selection Logic ---
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.returns().length;
    return numSelected === numRows && numRows > 0;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.returns().forEach(row => this.selection.select(row));
  }

  // --- Bulk Actions ---
  applyBulkAction(actionType: 'staff' | 'status') {
    if (this.selection.selected.length === 0) return;

    this.loadingService.show();
    const updates = this.selection.selected.map(row => {
      const updatePayload: any = { id: row.id };
      if (this.bulkStatusCtrl.value) {
        updatePayload.gstr1_status = this.bulkStatusCtrl.value;
        updatePayload.gstr3b_status = this.bulkStatusCtrl.value;
      }
      if (this.bulkStaffCtrl.value) {
        updatePayload.assigned_to = this.bulkStaffCtrl.value;
      }
      return updatePayload;
    });

    this.gstRecordService.bulkUpdate(updates).subscribe({
      next: () => {
        this.snackBar.open(`Updated ${updates.length} records`, 'Close', { duration: 3000 });
        this.selection.clear();
        this.bulkStaffCtrl.reset();
        this.bulkStatusCtrl.reset();
        this.loadingService.hide();
        this.loadReturns();
      },
      error: () => this.loadingService.hide()
    });
  }

  openDrawer(ret: GstRecord): void {
    this.selectedReturn = ret;
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
    this.selectedReturn = null;
  }

  saveDrawer(payload: Partial<GstRecord>): void {
    if (!this.selectedReturn) return;
    this.loadingService.show();

    this.gstRecordService.update(this.selectedReturn.id, payload).subscribe({
      next: () => {
        this.snackBar.open('Record updated', 'Close', { duration: 3000 });
        this.loadingService.hide();
        this.closeDrawer();
        this.loadReturns();
      },
      error: () => this.loadingService.hide()
    });
  }

  // --- Helpers ---
  getStaffName(staffId: string | undefined): string {
    if (!staffId) return 'Unassigned';
    const staff = this.staffList().find(s => s.id === staffId);
    return staff?.name || staff?.email || staffId;
  }

  getDaysRemaining(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isRowOverdue(ret: GstRecord): boolean {
    return ret.gstr1_status === 'pending' || ret.gstr3b_status === 'pending';
  }
}
