import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-shimmer" [ngStyle]="styles"></div>
  `,
  styles: [`
    :host {
      display: block;
      line-height: 1;
      width: 100%;
    }

    .skeleton-shimmer {
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        var(--border-color) 25%,
        var(--bg-main) 50%,
        var(--border-color) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite linear;
      border-radius: inherit;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class SkeletonComponent {
  @Input() width: string = '100%';
  @Input() height: string = '20px';
  @Input() borderRadius: string = '4px';
  @Input() circle: boolean = false;

  get styles() {
    return {
      width: this.width,
      height: this.height,
      'border-radius': this.circle ? '50%' : this.borderRadius
    };
  }
}
