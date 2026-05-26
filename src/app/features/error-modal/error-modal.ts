import { Component, input, output, viewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [],
  templateUrl: './error-modal.html',
  styleUrl: './error-modal.scss'
})
export class ErrorModal implements AfterViewInit {
  // Query reference to primary action button to direct keyboard focus for instant dismissal
  private readonly dismissButton = viewChild<ElementRef<HTMLButtonElement>>('dismissButtonRef');

  // --- Inputs ---
  public readonly errorMessage = input.required<string>();

  // --- Outputs ---
  public readonly onClose = output<void>({ alias: 'close' });

  // --- Action Handlers ---
  protected triggerClose(): void {
    this.onClose.emit();
  }

  // Allow closing the modal using the Escape key globally
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.triggerClose();
  }

  public ngAfterViewInit(): void {
    // Focus the dismiss button immediately for smooth accessibility flow
    const btnEl = this.dismissButton()?.nativeElement;
    if (btnEl) {
      setTimeout(() => btnEl.focus(), 50);
    }
  }
}
