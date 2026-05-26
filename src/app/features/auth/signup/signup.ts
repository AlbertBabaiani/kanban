import { Component, inject, signal, effect, viewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss'
})
export class Signup implements AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Focus reference for accessibility standard flow
  private readonly firstNameInput = viewChild<ElementRef<HTMLInputElement>>('firstNameInputRef');

  // --- Reactive Form Variables ---
  protected readonly firstName = signal<string>('');
  protected readonly lastName = signal<string>('');
  protected readonly email = signal<string>('');
  protected readonly password = signal<string>('');
  protected readonly confirmPassword = signal<string>('');
  protected readonly showPassword = signal<boolean>(false);
  protected readonly showConfirmPassword = signal<boolean>(false);
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
  protected readonly firstNameError = signal<string | null>(null);
  protected readonly lastNameError = signal<string | null>(null);
  protected readonly emailError = signal<string | null>(null);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly confirmPasswordError = signal<string | null>(null);
  protected readonly formErrorMessage = signal<string | null>(null);
  protected readonly isLoading = signal<boolean>(false);

  protected togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  protected toggleTheme(): void {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  public ngAfterViewInit(): void {
    // Direct keyboard focus to the first interactive field on view paint
    setTimeout(() => {
      this.firstNameInput()?.nativeElement.focus();
    }, 50);
  }

  // --- Input Handlers ---
  protected onFirstNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.firstName.set(value);
    if (this.firstNameError()) this.firstNameError.set(null);
  }

  protected onLastNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.lastName.set(value);
    if (this.lastNameError()) this.lastNameError.set(null);
  }

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

  protected onConfirmPasswordChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.confirmPassword.set(value);
    if (this.confirmPasswordError()) this.confirmPasswordError.set(null);
  }

  // --- Actions ---
  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.isLoading()) return;

    this.formErrorMessage.set(null);
    let hasError = false;

    // Validate first name
    const firstNameVal = this.firstName().trim();
    if (!firstNameVal) {
      this.firstNameError.set("Can't be empty");
      hasError = true;
    }

    // Validate last name
    const lastNameVal = this.lastName().trim();
    if (!lastNameVal) {
      this.lastNameError.set("Can't be empty");
      hasError = true;
    }

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
    } else if (passwordVal.length < 6) {
      this.passwordError.set('At least 6 characters');
      hasError = true;
    }

    // Validate confirm password
    const confirmPasswordVal = this.confirmPassword();
    if (!confirmPasswordVal) {
      this.confirmPasswordError.set("Can't be empty");
      hasError = true;
    } else if (passwordVal !== confirmPasswordVal) {
      this.confirmPasswordError.set("Passwords don't match");
      hasError = true;
    }

    if (hasError) return;

    this.isLoading.set(true);
    this.authService.signUp(emailVal, passwordVal, firstNameVal, lastNameVal)
      .then(() => {
        this.isLoading.set(false);
        return this.router.navigate(['/']);
      })
      .catch((err: any) => {
        this.isLoading.set(false);
        console.error('Registration action rejected:', err);
        if (err.code === 'auth/email-already-in-use') {
          this.formErrorMessage.set('This email address is already registered.');
        } else {
          this.formErrorMessage.set(err.message || 'An unexpected failure occurred.');
        }
      });
  }
}
