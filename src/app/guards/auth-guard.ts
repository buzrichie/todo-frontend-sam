import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AmplifyService } from '../services/amplify-service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private amplifyService: AmplifyService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    try {
      const isAuthenticated = await this.amplifyService.isAuthenticated();

      if (isAuthenticated) {
        return true;
      } else {
        this.router.navigate(['/login']);
        return false;
      }
    } catch {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
