import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ErrorModal } from './features/error-modal/error-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ErrorModal],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  // Global catch error overlay backing signal
  protected readonly errorMessage = signal<string | null>(null);

  protected clearError(): void {
    this.errorMessage.set(null);
  }
}
