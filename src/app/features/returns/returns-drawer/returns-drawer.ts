import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { GstRecord, User } from '../../../core/models';

@Component({
  selector: 'app-returns-drawer',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatDatepickerModule,
    MatNativeDateModule, MatProgressSpinnerModule, MatCheckboxModule, MatExpansionModule
  ],
  templateUrl: './returns-drawer.html',
  styleUrl: './returns-drawer.scss'
})
export class ReturnsDrawerComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() returnData: GstRecord | null = null;
  @Input() staffList: User[] = [];
  @Input() statusOptions: { value: string; label: string }[] = [];
  @Input() isSubmitting = false;

  @Output() closeDrawer = new EventEmitter<void>();
  @Output() saveReturn = new EventEmitter<Partial<GstRecord>>();

  editForm = new FormGroup({
    id: new FormControl(''),

    // GSTR-1
    gstr1_status: new FormControl<string>('pending', [Validators.required]),
    gstr1_filed_date: new FormControl<string | null>(null),
    gstr1_tally_received: new FormControl<string>(''),
    gstr1_entered_in_tally: new FormControl<boolean>(false),
    gstr1_nil_return: new FormControl<boolean>(false),
    gstr1_comments: new FormControl(''),

    // GSTR-3B
    gstr3b_status: new FormControl<string>('pending', [Validators.required]),
    gstr3b_filed_date: new FormControl<string | null>(null),
    gstr3b_tally_received: new FormControl<string>(''),
    gstr3b_entered_in_tally: new FormControl<boolean>(false),
    gstr3b_reconciliation: new FormControl<string>(''),
    gstr3b_notices_orders: new FormControl<boolean>(false),
    gstr3b_bills_pending: new FormControl<boolean>(false),
    gstr3b_tax_liability: new FormControl<string>(''),
    gstr3b_nil_return: new FormControl<boolean>(false),
    gstr3b_comments: new FormControl(''),

    // Other/Billing
    gstr1a_applicable: new FormControl<boolean>(false),
    billing_status: new FormControl<string>(''),
    bill_sent: new FormControl<boolean>(false),

    remarks: new FormControl('') // Keep legacy if needed, or remove later
  });

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['returnData'] && this.returnData) {
      this.populateForm(this.returnData);
    }
  }

  private populateForm(ret: GstRecord): void {
    this.editForm.patchValue({
      id: ret.id,
      gstr1_status: ret.gstr1_status,
      gstr1_filed_date: ret.gstr1_filed_date || null,
      gstr1_tally_received: ret.gstr1_tally_received || '',
      gstr1_entered_in_tally: ret.gstr1_entered_in_tally || false,
      gstr1_nil_return: ret.gstr1_nil_return || false,
      gstr1_comments: ret.gstr1_comments || '',

      gstr3b_status: ret.gstr3b_status,
      gstr3b_filed_date: ret.gstr3b_filed_date || null,
      gstr3b_tally_received: ret.gstr3b_tally_received || '',
      gstr3b_entered_in_tally: ret.gstr3b_entered_in_tally || false,
      gstr3b_reconciliation: ret.gstr3b_reconciliation || '',
      gstr3b_notices_orders: ret.gstr3b_notices_orders || false,
      gstr3b_bills_pending: ret.gstr3b_bills_pending || false,
      gstr3b_tax_liability: ret.gstr3b_tax_liability || '',
      gstr3b_nil_return: ret.gstr3b_nil_return || false,
      gstr3b_comments: ret.gstr3b_comments || '',

      gstr1a_applicable: ret.gstr1a_applicable || false,
      billing_status: ret.billing_status || '',
      bill_sent: ret.bill_sent || false,

      remarks: ret.remarks || ''
    });
  }

  onClose() {
    this.closeDrawer.emit();
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const value = this.editForm.value;
    const payload: Partial<GstRecord> = {
      gstr1_status: value.gstr1_status as any,
      gstr1_tally_received: value.gstr1_tally_received || '',
      gstr1_entered_in_tally: value.gstr1_entered_in_tally || false,
      gstr1_nil_return: value.gstr1_nil_return || false,
      gstr1_comments: value.gstr1_comments || '',

      gstr3b_status: value.gstr3b_status as any,
      gstr3b_tally_received: value.gstr3b_tally_received || '',
      gstr3b_entered_in_tally: value.gstr3b_entered_in_tally || false,
      gstr3b_reconciliation: value.gstr3b_reconciliation || '',
      gstr3b_notices_orders: value.gstr3b_notices_orders || false,
      gstr3b_bills_pending: value.gstr3b_bills_pending || false,
      gstr3b_tax_liability: value.gstr3b_tax_liability || '',
      gstr3b_nil_return: value.gstr3b_nil_return || false,
      gstr3b_comments: value.gstr3b_comments || '',

      gstr1a_applicable: value.gstr1a_applicable || false,
      billing_status: value.billing_status || '',
      bill_sent: value.bill_sent || false,

      remarks: value.remarks || undefined
    };

    if (value.gstr1_filed_date) {
      payload.gstr1_filed_date = this.formatDate(value.gstr1_filed_date);
    }
    if (value.gstr3b_filed_date) {
      payload.gstr3b_filed_date = this.formatDate(value.gstr3b_filed_date);
    }

    this.saveReturn.emit(payload);
  }

  private formatDate(date: any): string {
    if (typeof date === 'string') return date.split('T')[0];
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }
}
