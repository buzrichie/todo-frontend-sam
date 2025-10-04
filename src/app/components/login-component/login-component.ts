import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AmplifyService } from '../../services/amplify-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent implements OnInit {
  authForm: FormGroup;
  isLoginMode = true;
  needsConfirmation = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private amplifyService: AmplifyService,
    private router: Router
  ) {
    this.authForm = this.createAuthForm();
  }

  ngOnInit() {
    // Watch for mode changes to update validators
    this.authForm.get('isLoginMode')?.valueChanges.subscribe(() => {
      this.updatePasswordValidators();
    });
  }

  private createAuthForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmationCode: [''],
      isLoginMode: [true],
    });
  }

  private updatePasswordValidators() {
    const passwordControl = this.authForm.get('password');

    if (this.isLoginMode) {
      passwordControl?.setValidators([Validators.required, Validators.minLength(8)]);
    } else {
      passwordControl?.setValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/), // At least one lowercase, one uppercase, one number
      ]);
    }

    passwordControl?.updateValueAndValidity();
  }

  get email() {
    return this.authForm.get('email');
  }

  get password() {
    return this.authForm.get('password');
  }

  get confirmationCode() {
    return this.authForm.get('confirmationCode');
  }

  async onSubmit() {
    if (this.authForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.authForm.value;

    try {
      if (this.isLoginMode) {
        if (this.needsConfirmation) {
          await this.amplifyService.confirmSignUp(formValue.email, formValue.confirmationCode);
          this.successMessage = 'Email confirmed successfully! You can now sign in.';
          this.needsConfirmation = false;
          this.authForm.patchValue({ confirmationCode: '' });
        } else {
          await this.amplifyService.signIn(formValue.email, formValue.password);
          this.router.navigate(['/tasks']);
        }
      } else {
        const result = await this.amplifyService.signUp(formValue.email, formValue.password);
        this.successMessage = result.message;

        // Check if confirmation is needed
        if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
          this.needsConfirmation = true;
          this.isLoginMode = true;
          this.authForm.get('confirmationCode')?.setValidators([Validators.required]);
          this.authForm.get('confirmationCode')?.updateValueAndValidity();
        } else {
          this.isLoginMode = true;
          this.authForm.patchValue({
            email: '',
            password: '',
            isLoginMode: true,
          });
          this.updatePasswordValidators();
        }
      }
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.loading = false;
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.needsConfirmation = false;
    this.errorMessage = '';
    this.successMessage = '';

    this.authForm.patchValue({
      email: '',
      password: '',
      confirmationCode: '',
      isLoginMode: this.isLoginMode,
    });

    this.authForm.get('confirmationCode')?.clearValidators();
    this.authForm.get('confirmationCode')?.updateValueAndValidity();

    this.updatePasswordValidators();
    this.markAllFieldsAsUntouched();
  }

  resendConfirmationCode() {
    // You can implement resend functionality here if needed
    this.successMessage = 'Confirmation code sent again. Please check your email.';
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.authForm.controls).forEach((key) => {
      this.authForm.get(key)?.markAsTouched();
    });
  }

  private markAllFieldsAsUntouched() {
    Object.keys(this.authForm.controls).forEach((key) => {
      this.authForm.get(key)?.markAsUntouched();
    });
  }

  getEmailErrorMessage(): string {
    if (this.email?.hasError('required')) {
      return 'Email is required';
    }
    if (this.email?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    if (this.password?.hasError('required')) {
      return 'Password is required';
    }
    if (this.password?.hasError('minlength')) {
      return 'Password must be at least 8 characters long';
    }
    if (this.password?.hasError('pattern')) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    return '';
  }

  getConfirmationCodeErrorMessage(): string {
    if (this.confirmationCode?.hasError('required')) {
      return 'Confirmation code is required';
    }
    return '';
  }
}
