import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private snackBar = inject(MatSnackBar);
  private zone = inject(NgZone);

  handleError(error: any): void {
    // Log to console for debugging
    console.error('Global Error caught:', error);

    // Skip HttpErrorResponse notifications as they are handled by errorInterceptor
    if (error instanceof HttpErrorResponse || error?.rejection instanceof HttpErrorResponse) {
      return;
    }

    // Show user-friendly message in NgZone to ensure UI updates
    this.zone.run(() => {
      const message = error?.message || 'An unexpected error occurred. Please try again.';
      this.snackBar.open(message, 'Dismiss', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    });
  }
}
