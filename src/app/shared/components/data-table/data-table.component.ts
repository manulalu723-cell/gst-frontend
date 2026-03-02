import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { NgIf, NgFor, NgTemplateOutlet, CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton';

export interface TableColumn {
  key: string;
  label: string;
  template?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    NgTemplateOutlet,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    SkeletonComponent
  ],
  template: `
    <div class="table-wrapper premium-card">
      <div class="table-container">
        <table mat-table [dataSource]="isLoading ? skeletonRows : data" [trackBy]="trackByFn">
          
          <ng-container *ngFor="let col of columns" [matColumnDef]="col.key">
            <th mat-header-cell *matHeaderCellDef> {{ col.label }} </th>
            <td mat-cell *matCellDef="let element">
              <ng-container *ngIf="isLoading; else actualData">
                <app-skeleton height="20px" width="80%"></app-skeleton>
              </ng-container>
              
              <ng-template #actualData>
                <ng-container *ngIf="col.template; else rawValue">
                  <ng-container *ngTemplateOutlet="getTemplate(col.key); context: { $implicit: element }">
                  </ng-container>
                </ng-container>
                <ng-template #rawValue>{{ element[col.key] }}</ng-template>
              </ng-template>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumnKeys"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumnKeys;"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell no-data-cell" [attr.colspan]="columns.length" *ngIf="!isLoading">
              <div class="empty-state">
                <mat-icon>search_off</mat-icon>
                <span>No data found matching current filters.</span>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <mat-paginator
        [length]="total"
        [pageSize]="pageSize"
        [pageSizeOptions]="[10, 25, 50, 100]"
        (page)="onPageChange($event)"
        aria-label="Select page">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .table-wrapper { 
      overflow: hidden; 
      background: var(--bg-card);
      border: 1px solid var(--border-color);
    }
    .table-container { overflow-x: auto; min-height: 200px; position: relative; }
    table { width: 100%; }
    
    th.mat-header-cell {
      background-color: var(--bg-main);
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 16px 24px;
      white-space: nowrap;
    }

    td.mat-cell {
      padding: 16px 24px;
      color: var(--text-main);
      border-bottom-color: var(--border-color);
      white-space: nowrap;
    }

    .no-data-cell { 
      padding: 64px 16px; 
      text-align: center;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--text-muted);
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }

    ::ng-deep .mat-mdc-paginator {
      background: transparent !important;
      border-top: 1px solid var(--border-color);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent {
  @Input() data: any[] = [];
  skeletonRows = Array(5).fill({});
  @Input() columns: TableColumn[] = [];
  @Input() total = 0;
  @Input() pageSize = 10;
  @Input() isLoading = false;
  @Input() trackByProperty = 'id';

  // Templates passed from parent
  @Input() templates: { [key: string]: TemplateRef<any> } = {};

  @Output() pageChanged = new EventEmitter<PageEvent>();

  get displayedColumnKeys(): string[] {
    return this.columns.map(c => c.key);
  }

  getTemplate(key: string): TemplateRef<any> | null {
    return this.templates[key] || null;
  }

  trackByFn = (index: number, item: any) => {
    return item[this.trackByProperty] || index;
  };

  onPageChange(event: PageEvent): void {
    this.pageChanged.emit(event);
  }
}
