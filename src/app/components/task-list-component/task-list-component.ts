import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../services/task-service';
import { AmplifyService, AuthUser } from '../../services/amplify-service';
import { Task } from '../../models/task.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-list-component',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './task-list-component.html',
  styleUrl: './task-list-component.css',
})
export class TaskListComponent implements OnInit {
  taskForm: FormGroup;
  editTaskForm: FormGroup;
  tasks: Task[] = [];
  loading = false;
  errorMessage = '';
  filterStatus: string = 'all';
  editingTaskId: string | null = null;
  currentUser$: Observable<AuthUser | null>;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private amplifyService: AmplifyService
  ) {
    this.taskForm = this.createTaskForm();
    this.editTaskForm = this.createEditTaskForm();
    this.currentUser$ = this.amplifyService.currentUser$;
  }

  async ngOnInit() {
    await this.loadTasks();
  }

  private createTaskForm(): FormGroup {
    return this.fb.group({
      description: ['', [Validators.required, Validators.minLength(1)]],
      date: [''],
    });
  }

  private createEditTaskForm(): FormGroup {
    return this.fb.group({
      description: ['', [Validators.required, Validators.minLength(1)]],
      status: ['Pending'],
    });
  }

  get description() {
    return this.taskForm.get('description');
  }

  get editDescription() {
    return this.editTaskForm.get('description');
  }

  async loadTasks() {
    this.loading = true;
    this.errorMessage = '';

    try {
      this.tasks = await this.taskService.getTasks();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to load tasks';
      console.error('Error loading tasks:', error);
    } finally {
      this.loading = false;
    }
  }

  async createTask() {
    if (this.taskForm.invalid) {
      this.markFormFieldsAsTouched(this.taskForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const formValue = this.taskForm.value;
      const newTask = await this.taskService.createTask({
        description: formValue.description.trim(),
        date: formValue.date || undefined,
      });

      this.tasks.unshift(newTask);
      this.taskForm.reset();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to create task';
    } finally {
      this.loading = false;
    }
  }

  async updateTaskStatus(task: Task, newStatus: 'Completed' | 'Pending') {
    this.loading = true;
    try {
      await this.taskService.updateTask(task.taskId, { status: newStatus });
      task.status = newStatus;
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to update task';
    } finally {
      this.loading = false;
    }
  }

  async deleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.loading = true;
      try {
        await this.taskService.deleteTask(taskId);
        this.tasks = this.tasks.filter((task) => task.taskId !== taskId);
      } catch (error: any) {
        this.errorMessage = error.message || 'Failed to delete task';
      } finally {
        this.loading = false;
      }
    }
  }

  startEditTask(task: Task) {
    this.editingTaskId = task.taskId;
    this.editTaskForm.patchValue({
      description: task.description,
      status: task.status,
    });
  }

  async saveEditTask(taskId: string) {
    if (this.editTaskForm.invalid) {
      this.markFormFieldsAsTouched(this.editTaskForm);
      return;
    }

    this.loading = true;
    try {
      const updates = this.editTaskForm.value;
      await this.taskService.updateTask(taskId, updates);

      // Update local task
      const task = this.tasks.find((t) => t.taskId === taskId);
      if (task) {
        task.description = updates.description;
        task.status = updates.status;
      }

      this.cancelEdit();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to update task';
    } finally {
      this.loading = false;
    }
  }

  cancelEdit() {
    this.editingTaskId = null;
    this.editTaskForm.reset();
  }

  async signOut() {
    try {
      await this.amplifyService.signOut();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to sign out';
    }
  }

  // Filtering methods
  setFilter(status: string) {
    this.filterStatus = status;
  }

  getFilteredTasks(): Task[] {
    switch (this.filterStatus) {
      case 'completed':
        return this.tasks.filter((task) => task.status === 'Completed');
      case 'pending':
        return this.tasks.filter((task) => task.status === 'Pending' && !this.isTaskExpired(task));
      case 'expired':
        return this.tasks.filter((task) => this.isTaskExpired(task) || task.status === 'Expired');
      default:
        return this.tasks;
    }
  }

  // Statistics methods
  getCompletedTasksCount(): number {
    return this.tasks.filter((task) => task.status === 'Completed').length;
  }

  getPendingTasksCount(): number {
    return this.tasks.filter((task) => task.status === 'Pending' && !this.isTaskExpired(task))
      .length;
  }

  getExpiredTasksCount(): number {
    return this.tasks.filter((task) => this.isTaskExpired(task) || task.status === 'Expired')
      .length;
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    return this.taskService.getStatusBadgeClass(status);
  }

  formatDeadline(deadline: number): string {
    return this.taskService.formatDeadline(deadline);
  }

  getTimeRemaining(deadline: number): string {
    return this.taskService.getTimeRemaining(deadline);
  }

  isTaskExpired(task: Task): boolean {
    return this.taskService.isTaskExpired(task);
  }

  getDescriptionErrorMessage(): string {
    if (this.description?.hasError('required')) {
      return 'Task description is required';
    }
    if (this.description?.hasError('minlength')) {
      return 'Task description is too short';
    }
    return '';
  }

  private markFormFieldsAsTouched(form: FormGroup) {
    Object.keys(form.controls).forEach((key) => {
      form.get(key)?.markAsTouched();
    });
  }
}
