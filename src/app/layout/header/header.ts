import { Component, input, output, signal, HostListener, ElementRef, inject } from '@angular/core';
import { Board } from '../../core/models/kanban.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  private readonly elementRef = inject(ElementRef);

  // --- Inputs ---
  public readonly activeBoard = input<Board | null>(null);
  public readonly isMobileMenuOpen = input.required<boolean>();
  public readonly theme = input<'light' | 'dark'>('light');

  // --- Outputs ---
  public readonly onToggleMobileMenu = output<void>({ alias: 'toggleMobileMenu' });
  public readonly onCreateTask = output<void>({ alias: 'createTask' });
  public readonly onEditBoard = output<void>({ alias: 'editBoard' });
  public readonly onDeleteBoard = output<void>({ alias: 'deleteBoard' });

  // --- UI Reactive States ---
  protected readonly isOptionsMenuOpen = signal<boolean>(false);

  // --- Actions ---
  protected triggerToggleMobileMenu(): void {
    this.onToggleMobileMenu.emit();
  }

  protected triggerCreateTask(): void {
    this.onCreateTask.emit();
  }

  protected toggleOptionsMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isOptionsMenuOpen.update(val => !val);
  }

  protected triggerEditBoard(): void {
    this.isOptionsMenuOpen.set(false);
    this.onEditBoard.emit();
  }

  protected triggerDeleteBoard(): void {
    this.isOptionsMenuOpen.set(false);
    this.onDeleteBoard.emit();
  }

  // Auto-dismiss board options dropdown on clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOptionsMenuOpen.set(false);
    }
  }
}
