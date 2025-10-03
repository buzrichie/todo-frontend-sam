import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  type SignUpInput,
  type SignInInput,
  type ConfirmSignUpInput,
  type ResetPasswordInput,
  type ConfirmResetPasswordInput,
} from 'aws-amplify/auth';

export interface AuthUser {
  username: string;
  userId: string;
  signInDetails?: any;
}

@Injectable({
  providedIn: 'root',
})
export class AmplifyService {
  private authStatus = new BehaviorSubject<boolean>(false);
  public authStatus$ = this.authStatus.asObservable();

  private currentUser = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUser.asObservable();

  constructor() {
    this.checkAuthStatus();
  }

  // Sign Up
  async signUp(email: string, password: string) {
    try {
      const signUpInput: SignUpInput = {
        username: email,
        password,
        options: {
          userAttributes: {
            email: email,
          },
          autoSignIn: true, // Enable auto sign-in after confirmation
        },
      };

      const { isSignUpComplete, userId, nextStep } = await signUp(signUpInput);

      return {
        isSignUpComplete,
        userId,
        nextStep,
        message: 'Sign-up successful! Please check your email for verification code.',
      };
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Confirm Sign Up
  async confirmSignUp(email: string, confirmationCode: string) {
    try {
      const confirmSignUpInput: ConfirmSignUpInput = {
        username: email,
        confirmationCode,
      };

      const { isSignUpComplete, nextStep } = await confirmSignUp(confirmSignUpInput);

      return {
        isSignUpComplete,
        nextStep,
        message: 'Email verified successfully! You can now sign in.',
      };
    } catch (error: any) {
      console.error('Error confirming sign up:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Sign In
  async signIn(email: string, password: string) {
    try {
      const signInInput: SignInInput = {
        username: email,
        password,
      };

      const { isSignedIn, nextStep } = await signIn(signInInput);

      if (isSignedIn) {
        await this.updateAuthStatus();
      }

      return {
        isSignedIn,
        nextStep,
        message: 'Sign-in successful!',
      };
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Sign Out
  async signOut() {
    try {
      await signOut();
      this.authStatus.next(false);
      this.currentUser.next(null);
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Get Current User
  async getCurrentUser() {
    try {
      const user = await getCurrentUser();
      this.currentUser.next(user);
      return user;
    } catch (error) {
      this.currentUser.next(null);
      return null;
    }
  }

  // Get JWT Token
  async getJwtToken(): Promise<string> {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        throw new Error('No token available');
      }

      return token;
    } catch (error) {
      throw new Error('No authenticated user');
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      await getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  // Reset Password
  async resetPassword(email: string) {
    try {
      const resetPasswordInput: ResetPasswordInput = {
        username: email,
      };

      const { nextStep } = await resetPassword(resetPasswordInput);

      return {
        nextStep,
        message: 'Password reset code sent to your email.',
      };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Confirm Reset Password
  async confirmResetPassword(email: string, confirmationCode: string, newPassword: string) {
    try {
      const confirmResetPasswordInput: ConfirmResetPasswordInput = {
        username: email,
        confirmationCode,
        newPassword,
      };

      await confirmResetPassword(confirmResetPasswordInput);

      return {
        message: 'Password reset successfully! You can now sign in with your new password.',
      };
    } catch (error: any) {
      console.error('Error confirming password reset:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Update authentication status
  private async updateAuthStatus() {
    try {
      const isAuth = await this.isAuthenticated();
      this.authStatus.next(isAuth);

      if (isAuth) {
        await this.getCurrentUser();
      }
    } catch {
      this.authStatus.next(false);
      this.currentUser.next(null);
    }
  }

  // Check auth status on service initialization
  private async checkAuthStatus() {
    await this.updateAuthStatus();
  }

  // Error message helper
  private getErrorMessage(error: any): string {
    if (!error.name) return error.message || 'An error occurred';

    switch (error.name) {
      case 'UserNotFoundException':
        return 'User not found. Please check your email or sign up.';
      case 'NotAuthorizedException':
        return 'Incorrect password. Please try again.';
      case 'UserNotConfirmedException':
        return 'Please confirm your email address before signing in.';
      case 'UsernameExistsException':
        return 'An account with this email already exists.';
      case 'InvalidParameterException':
        return 'Invalid email or password format.';
      case 'CodeMismatchException':
        return 'Invalid verification code.';
      case 'ExpiredCodeException':
        return 'Verification code has expired.';
      case 'LimitExceededException':
        return 'Attempt limit exceeded. Please try again later.';
      default:
        return error.message || 'An error occurred during authentication.';
    }
  }
}
