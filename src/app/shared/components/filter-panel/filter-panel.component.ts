import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

export interface FilterOption {
  value: any;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select';
  options?: FilterOption[];
  icon?: string;
  placeholder?: string;
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  template: `
    <div class="filter-panel premium-card" [formGroup]="filterForm">
      <div class="filters-container">
        <ng-container *ngFor="let config of configs">
          
          <!-- Text Filter -->
          <mat-form-field appearance="outline" *ngIf="config.type === 'text'" [ngClass]="['filter-field', config.key]">
            <mat-label>{{ config.label }}</mat-label>
            <input matInput [formControlName]="config.key" [placeholder]="config.placeholder || ''">
            <mat-icon matPrefix *ngIf="config.icon" class="filter-icon">{{ config.icon }}</mat-icon>
          </mat-form-field>
  
          <!-- Select Filter -->
          <mat-form-field appearance="outline" *ngIf="config.type === 'select'" [ngClass]="['filter-field', config.key]">
            <mat-label>{{ config.label }}</mat-label>
            <mat-select [formControlName]="config.key">
              <mat-option value="">All {{ config.label }}</mat-option>
              <mat-option *ngFor="let opt of config.options" [value]="opt.value">
                {{ opt.label }}
              </mat-option>
            </mat-select>
          </mat-form-field>
  
        </ng-container>
      </div>
      
      <div class="extra-actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .filter-panel { 
      display: flex; 
      align-items: center; 
      justify-content: space-between;
      padding: 12px 20px; 
      margin-bottom: 24px;
      gap: 20px;
    }
    
    .filters-container {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      flex: 1;
    }

    .filter-field {
      width: 200px;
      margin-bottom: -1.25em; // Standardize material density
      
      &.search, &.clientName { width: 320px; }
      
      .filter-icon {
        color: var(--text-muted);
        margin-right: 8px;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .extra-actions { 
      display: flex; 
      align-items: center; 
      gap: 12px;
      padding-left: 20px;
      border-left: 1px solid var(--border-color);
    }

    @media (max-width: 960px) {
      .filter-panel { flex-direction: column; align-items: stretch; }
      .extra-actions { border-left: none; padding-left: 0; border-top: 1px solid var(--border-color); padding-top: 12px; justify-content: flex-end; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterPanelComponent implements OnInit, OnDestroy {
  @Input() configs: FilterConfig[] = [];
  @Input() debounceTime = 400;
  
  @Output() filterChanged = new EventEmitter<any>();

  filterForm = new FormGroup({});
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Initialize form controls based on config
    this.configs.forEach(c => {
      this.filterForm.addControl(c.key, new FormControl(''));
    });

    // Handle debounced changes
    this.filterForm.valueChanges.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).subscribe(values => {
      this.filterChanged.emit(values);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
