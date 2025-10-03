import { Routes } from '@angular/router';
import { TaskListComponent } from './components/task-list-component/task-list-component';
import { LoginComponent } from './components/login-component/login-component';
import { AuthGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', component: TaskListComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'tasks', component: TaskListComponent, canActivate: [AuthGuard] },
];
