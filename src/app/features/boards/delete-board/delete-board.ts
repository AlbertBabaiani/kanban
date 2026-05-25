import { Component, input, output, viewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-delete-board',
  standalone: true,
  imports: [],
  templateUrl: './delete-board.html',
  styleUrl: './delete-board.scss'
})
export class DeleteBoard implements AfterViewInit {
  // Query reference to the cancel button element for keyboard focus management
  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButtonRef');

  // --- Inputs ---
  public readonly boardName = input.required<string>();

  // --- Outputs ---
  public readonly onClose = output<void>({ alias: 'close' });
  public readonly onConfirm = output<void>({ alias: 'confirm' });

  // --- UI Action Handlers ---
  protected triggerClose(): void {
    this.onClose.emit();
  }

  protected triggerConfirm(): void {
    this.onConfirm.emit();
  }

  // Allow closing the modal using the Escape key globally
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.triggerClose();
  }

  public ngAfterViewInit(): void {
    // Safety auto-focus on the 'Cancel' button to prevent accidental board deletion
    const btnEl = this.cancelButton()?.nativeElement;
    if (btnEl) {
      setTimeout(() => btnEl.focus(), 50);
    }
  }
}
