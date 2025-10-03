import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AmplifyService } from './services/amplify-service';
import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AmplifyAuthenticatorModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('todo-frontend-sam');
  isAuthenticated = false;

  constructor(private amplifyService: AmplifyService) {}

  ngOnInit() {
    this.amplifyService.authStatus$.subscribe((status) => (this.isAuthenticated = status));
  }
}
