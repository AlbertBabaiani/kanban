import { Component, inject, signal, effect, viewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Focus reference for accessibility standard flow
  private readonly emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInputRef');

  // --- Reactive Form Variables ---
  protected readonly email = signal<string>('');
  protected readonly password = signal<string>('');
  protected readonly showPassword = signal<boolean>(false);
  protected readonly theme = signal<'light' | 'dark'>('light');

  constructor() {
    // 1. Detect and apply theme preferences
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      this.theme.set(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme.set(prefersDark ? 'dark' : 'light');
    }

    // 2. Reactively synchronize theme switch to document attributes
    effect(() => {
      const activeTheme = this.theme();
      document.documentElement.setAttribute('data-theme', activeTheme);
      localStorage.setItem('theme', activeTheme);
    });
  }

  // --- Validation Alert Signals ---
  protected readonly emailError = signal<string | null>(null);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly formErrorMessage = signal<string | null>(null);
  protected readonly isLoading = signal<boolean>(false);

  protected togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  protected toggleTheme(): void {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  public ngAfterViewInit(): void {
    // Direct keyboard focus to the first interactive field on view paint
    setTimeout(() => {
      this.emailInput()?.nativeElement.focus();
    }, 50);
  }

  // --- Input Handlers ---
  protected onEmailChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.email.set(value);
    if (this.emailError()) this.emailError.set(null);
  }

  protected onPasswordChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.password.set(value);
    if (this.passwordError()) this.passwordError.set(null);
  }

  // --- Actions ---
  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.isLoading()) return;

    this.formErrorMessage.set(null);
    let hasError = false;

    // Validate email
    const emailVal = this.email().trim();
    if (!emailVal) {
      this.emailError.set("Can't be empty");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      this.emailError.set('Invalid email format');
      hasError = true;
    }

    // Validate password
    const passwordVal = this.password();
    if (!passwordVal) {
      this.passwordError.set("Can't be empty");
      hasError = true;
    }

    if (hasError) return;

    this.isLoading.set(true);
    this.authService.signIn(emailVal, passwordVal)
      .then(() => {
        this.isLoading.set(false);
        return this.router.navigate(['/']);
      })
      .catch((err: any) => {
        this.isLoading.set(false);
        console.error('Login action rejected:', err);
        // Humanize classic Firebase errors
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          this.formErrorMessage.set('Invalid email or password credential.');
        } else {
          this.formErrorMessage.set(err.message || 'An unexpected failure occurred.');
        }
      });
  }
}
