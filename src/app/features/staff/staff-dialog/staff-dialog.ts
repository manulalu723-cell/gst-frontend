import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { User, UserRole } from '../../../core/models';

@Component({
  selector: 'app-staff-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  templateUrl: './staff-dialog.html',
  styleUrl: './staff-dialog.scss'
})
export class StaffDialogComponent implements OnInit {
  staffForm: FormGroup;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<StaffDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { staff?: User }
  ) {
    this.isEditMode = !!data.staff;
    this.staffForm = this.fb.group({
      id: [data.staff?.id || ''],
      name: [data.staff?.name || '', Validators.required],
      email: [data.staff?.email || '', [Validators.required, Validators.email]],
      role: [data.staff?.role || 'Staff', Validators.required],
      active: [data.staff?.active ?? true],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void { }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.staffForm.valid) {
      this.dialogRef.close(this.staffForm.value);
    }
  }
}
