import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClientService } from '../../../core/services/client.service';
import { StaffService } from '../../../core/services/staff.service';
import { FilingType } from '../../../core/models';

/**
 * Custom validator for Indian GSTIN format
 * Format: 2 digits(State Code) + 10 chars(PAN) + 1 digit(Entity Code) + 'Z' + 1 char(Checksum)
 */
export function gstinValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null; // let required validator handle empty cases

    // basic regex for GSTIN
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const valid = gstinRegex.test(value);

    return !valid ? { invalidGstin: true } : null;
  };
}

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './client-form.html',
  styleUrl: './client-form.scss',
})
export class ClientFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private staffService = inject(StaffService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  clientForm: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  clientId: string | null = null;
  staffList = signal<any[]>([]); // For assignee dropdown


  constructor() {
    this.clientForm = this.fb.group({
      clientName: ['', Validators.required],
      gstin: ['', [Validators.required, gstinValidator()]],
      filingType: ['Monthly' as FilingType, Validators.required],
      isActive: [true], // Default active
      lead: [''],
      defaultAssignedTo: [null],
      rank: [''],
      rcmApplicable: [false],
      contactNumber: [''],
      modeOfFiling: ['']
    });
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id');
    this.loadStaff();

    if (this.clientId) {
      this.isEditMode.set(true);
      this.loadClientData(this.clientId);
    }
  }

  loadClientData(id: string): void {
    this.isLoading.set(true);
    this.clientService.getById(id).subscribe({
      next: (client) => {
        this.clientForm.patchValue({
          clientName: client.clientName,
          gstin: client.gstin,
          filingType: client.filingType,
          isActive: client.isActive,
          lead: client.lead,
          defaultAssignedTo: client.defaultAssignedTo,
          rank: client.rank,
          rcmApplicable: client.rcmApplicable,
          contactNumber: client.contactNumber,
          modeOfFiling: client.modeOfFiling
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading client', err);
        // Fallback, redirect back
        this.isLoading.set(false);
        this.router.navigate(['/clients']);
      }
    });
  }

  loadStaff(): void {
    this.staffService.getPaginated(1, 100).subscribe({
      next: (res) => {
        // filter active only
        const activeStaff = res.items.filter(s => s.active !== false);
        this.staffList.set(activeStaff);
      },
      error: (err) => console.error('Failed to load staff for dropdown', err)
    });
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.clientForm.value;

    if (this.isEditMode() && this.clientId) {
      this.clientService.update(this.clientId, formValue).subscribe({
        next: () => this.handleSuccess(),
        error: () => this.isLoading.set(false)
      });
    } else {
      this.clientService.create(formValue).subscribe({
        next: () => this.handleSuccess(),
        error: () => this.isLoading.set(false)
      });
    }
  }

  handleSuccess(): void {
    this.isLoading.set(false);
    this.router.navigate(['/clients']);
  }

  onCancel(): void {
    this.router.navigate(['/clients']);
  }
}
