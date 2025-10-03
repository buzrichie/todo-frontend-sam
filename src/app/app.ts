import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AmplifyService } from './services/amplify-service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class App implements OnInit {
  protected readonly title = signal('todo-frontend-sam');
  isAuthenticated = false;

  constructor(private amplifyService: AmplifyService) {}

  ngOnInit() {
    this.amplifyService.authStatus$.subscribe((status) => (this.isAuthenticated = status));
  }
}
