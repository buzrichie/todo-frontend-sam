import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AmplifyService } from './amplify-service';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../models/task.model';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private amplifyService: AmplifyService) {}

  private async getAuthHeaders(): Promise<HttpHeaders> {
    const token = await this.amplifyService.getJwtToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  async getTasks(): Promise<Task[]> {
    const headers = await this.getAuthHeaders();
    return firstValueFrom(this.http.get<Task[]>(`${this.apiUrl}/tasks`, { headers }));
  }

  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    const headers = await this.getAuthHeaders();
    return firstValueFrom(this.http.post<Task>(`${this.apiUrl}/tasks`, taskData, { headers }));
  }

  async updateTask(taskId: string, updates: UpdateTaskRequest): Promise<any> {
    const headers = await this.getAuthHeaders();
    return firstValueFrom(this.http.put(`${this.apiUrl}/tasks/${taskId}`, updates, { headers }));
  }

  async deleteTask(taskId: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    return firstValueFrom(this.http.delete(`${this.apiUrl}/tasks/${taskId}`, { headers }));
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'badge-success';
      case 'expired':
        return 'badge-danger';
      default:
        return 'badge-warning';
    }
  }

  formatDeadline(deadline: number): string {
    return new Date(deadline).toLocaleString();
  }

  isTaskExpired(task: Task): boolean {
    return task.status === 'Expired' || Date.now() > task.deadline;
  }

  getTimeRemaining(deadline: number): string {
    const now = Date.now();
    const diff = deadline - now;

    if (diff <= 0) return 'Expired';

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  }
}
