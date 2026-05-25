import { Component, input, output } from '@angular/core';
import { Board } from '../../core/models/kanban.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  // --- Inputs ---
  public readonly activeBoard = input<Board | null>(null);
  public readonly isMobileMenuOpen = input.required<boolean>();

  // --- Outputs ---
  public readonly onToggleMobileMenu = output<void>({ alias: 'toggleMobileMenu' });
  public readonly onCreateTask = output<void>({ alias: 'createTask' });
  public readonly onBoardOptions = output<void>({ alias: 'boardOptions' });

  // --- Actions ---
  protected triggerToggleMobileMenu(): void {
    this.onToggleMobileMenu.emit();
  }

  protected triggerCreateTask(): void {
    this.onCreateTask.emit();
  }

  protected triggerBoardOptions(): void {
    this.onBoardOptions.emit();
  }
}
