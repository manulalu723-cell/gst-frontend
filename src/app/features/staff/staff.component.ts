import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { StaffService } from '../../core/services/staff.service';
import { GstRecordService } from '../../core/services/gst-record.service';
import { AuthService } from '../../core/services/auth.service';
import { LoadingService } from '../../core/services/loading.service';
import { User } from '../../core/models';
import { StaffDialogComponent } from './staff-dialog/staff-dialog';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterConfig } from '../../shared/components/filter-panel/filter-panel.component';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatCardModule,
    MatDialogModule, MatSnackBarModule, DataTableComponent, FilterPanelComponent
  ],
  templateUrl: './staff.html',
  styleUrl: './staff.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffComponent implements OnInit {
  private staffService = inject(StaffService);
  private gstRecordService = inject(GstRecordService);
  private loadingService = inject(LoadingService);
  authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  staff = signal<(User & { workload?: number })[]>([]);
  isLoading = this.loadingService.isLoading;
  currentSearch = '';

  columnConfig: TableColumn[] = [
    { key: 'name', label: 'FullName' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'active', label: 'Status', template: true },
    { key: 'workload', label: 'Workload', template: true },
    { key: 'actions', label: 'Actions', template: true }
  ];

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Search Staff', type: 'text', icon: 'search', placeholder: 'Name or email' }
  ];

  get isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'Admin';
  }

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.loadingService.show();

    forkJoin({
      staffRes: this.staffService.getPaginated(1, 100, this.currentSearch),
      returnsRes: this.gstRecordService.getPaginated(1, 10000)
    }).subscribe({
      next: ({ staffRes, returnsRes }) => {
        const returns = returnsRes?.items || [];
        const staffWithWorkload = (staffRes?.items || []).map(s => {
          const workload = returns.filter((r: any) => r.assigned_to === s.id).length;
          return { ...s, workload };
        });

        this.staff.set(staffWithWorkload);
        this.loadingService.hide();
      },
      error: () => this.loadingService.hide()
    });
  }

  onFilterChanged(filters: any): void {
    this.currentSearch = filters.search || '';
    this.loadStaff();
  }

  openStaffDialog(staff?: User): void {
    if (!this.isAdmin) return;

    const dialogRef = this.dialog.open(StaffDialogComponent, {
      width: '400px',
      data: { staff }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (staff) {
          this.updateStaff(staff.id, result);
        } else {
          this.addStaff(result);
        }
      }
    });
  }

  addStaff(data: Partial<User>): void {
    this.loadingService.show();
    this.staffService.create(data as User).subscribe({
      next: () => {
        this.snackBar.open('Staff member added', 'Close', { duration: 3000 });
        this.loadStaff();
      },
      error: () => this.loadingService.hide()
    });
  }

  updateStaff(id: string, data: Partial<User>): void {
    this.loadingService.show();
    this.staffService.update(id, data).subscribe({
      next: () => {
        this.snackBar.open('Staff member updated', 'Close', { duration: 3000 });
        this.loadStaff();
      },
      error: () => this.loadingService.hide()
    });
  }

  deleteStaff(staff: User): void {
    if (!this.isAdmin) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Staff Member',
        message: `Are you sure you want to delete ${staff.name}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.staffService.delete(staff.id).subscribe({
          next: () => {
            this.snackBar.open('Staff member deleted', 'Close', { duration: 3000 });
            this.loadStaff();
          },
          error: () => this.loadingService.hide()
        });
      }
    });
  }
}
