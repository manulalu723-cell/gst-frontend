import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private http = inject(HttpClient);

  profileForm: FormGroup;
  securityForm: FormGroup;

  isDarkMode = signal(false);
  isCompactView = signal(false);

  // Custom statuses
  customStatuses = signal<any[]>([]);
  newStatusName = '';

  constructor() {
    const user = this.authService.currentUser();

    this.profileForm = this.fb.group({
      name: [user?.name || '', Validators.required],
      email: [user?.email || '', [Validators.required, Validators.email]]
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.isDarkMode.set(document.body.classList.contains('dark-theme'));
    this.loadStatuses();
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      const currentUser = this.authService.currentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...this.profileForm.value };
        localStorage.setItem('user_info', JSON.stringify(updatedUser));
        this.authService.currentUser.set(updatedUser);
        this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
      }
    }
  }

  updatePassword(): void {
    if (this.securityForm.valid) {
      this.snackBar.open('Password changed successfully (Mock)', 'Close', { duration: 3000 });
      this.securityForm.reset();
    }
  }

  toggleDarkMode(enabled: boolean): void {
    this.isDarkMode.set(enabled);
    if (enabled) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  toggleCompactView(enabled: boolean): void {
    this.isCompactView.set(enabled);
    if (enabled) {
      document.body.classList.add('compact-view');
    } else {
      document.body.classList.remove('compact-view');
    }
  }

  // --- Custom Status Methods ---

  loadStatuses(): void {
    this.http.get<any>(`${environment.apiUrl}/settings?key=gst_status`).subscribe({
      next: (res) => {
        this.customStatuses.set(res.data?.items || []);
      }
    });
  }

  addStatus(): void {
    if (!this.newStatusName.trim()) return;

    this.http.post<any>(`${environment.apiUrl}/settings`, {
      key: 'gst_status',
      value: this.newStatusName.trim()
    }).subscribe({
      next: () => {
        this.snackBar.open(`Status "${this.newStatusName}" added`, 'Close', { duration: 3000 });
        this.newStatusName = '';
        this.loadStatuses();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to add status', 'Close', { duration: 3000 });
      }
    });
  }

  deleteStatus(id: string): void {
    this.http.delete<any>(`${environment.apiUrl}/settings/${id}`).subscribe({
      next: () => {
        this.snackBar.open('Status removed', 'Close', { duration: 3000 });
        this.loadStatuses();
      }
    });
  }
}
