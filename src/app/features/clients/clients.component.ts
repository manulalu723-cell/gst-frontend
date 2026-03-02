import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ClientService } from '../../core/services/client.service';
import { LoadingService } from '../../core/services/loading.service';
import { Client, FilingType } from '../../core/models';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterConfig } from '../../shared/components/filter-panel/filter-panel.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatSlideToggleModule, DataTableComponent, FilterPanelComponent
  ],
  templateUrl: './clients.html',
  styleUrl: './clients.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientsComponent implements OnInit {
  private clientService = inject(ClientService);
  private loadingService = inject(LoadingService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  clients = signal<Client[]>([]);
  totalClients = signal<number>(0);
  isLoading = this.loadingService.isLoading;

  pageIndex = 0;
  pageSize = 10;
  currentFilters: any = {};

  columnConfig: TableColumn[] = [
    { key: 'clientName', label: 'Client Name' },
    { key: 'lead', label: 'Lead' },
    { key: 'gstin', label: 'GSTIN' },
    { key: 'filingType', label: 'Filing Type' },
    { key: 'modeOfFiling', label: 'Filing Mode' },
    { key: 'isActive', label: 'Status', template: true },
    { key: 'actions', label: 'Actions', template: true }
  ];

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Search Clients', type: 'text', icon: 'search', placeholder: 'Search by name or GSTIN' },
    {
      key: 'filingType', label: 'Filing Type', type: 'select', options: [
        { value: 'Monthly', label: 'Monthly' },
        { value: 'Quarterly', label: 'Quarterly' },
        { value: 'QRMP', label: 'QRMP' }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loadingService.show();
    const filters: Partial<Client> = {};
    if (this.currentFilters.filingType) {
      filters.filingType = this.currentFilters.filingType;
    }

    this.clientService.getPaginated(
      this.pageIndex + 1,
      this.pageSize,
      this.currentFilters.search || '',
      filters
    ).subscribe({
      next: (res) => {
        this.clients.set(res.items);
        this.totalClients.set(res.total);
        this.loadingService.hide();
      },
      error: () => this.loadingService.hide()
    });
  }

  onFilterChanged(filters: any): void {
    this.currentFilters = filters;
    this.pageIndex = 0;
    this.loadClients();
  }

  onPageChanged(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadClients();
  }

  toggleStatus(client: Client, newStatus: boolean): void {
    this.loadingService.show();
    const updatedClient = { ...client, isActive: newStatus };
    this.clientService.update(client.id, updatedClient).subscribe({
      next: () => {
        this.loadClients();
        this.loadingService.hide();
      },
      error: () => this.loadingService.hide()
    });
  }

  addClient(): void {
    this.router.navigate(['/clients/add']);
  }

  editClient(client: Client): void {
    this.router.navigate(['/clients/edit', client.id]);
  }

  deleteClient(client: Client): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Client',
        message: `Are you sure you want to delete ${client.clientName}? This action cannot be undone.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.clientService.delete(client.id).subscribe({
          next: () => {
            this.loadClients();
            this.loadingService.hide();
          },
          error: () => this.loadingService.hide()
        });
      }
    });
  }
}
