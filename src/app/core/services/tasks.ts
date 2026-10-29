import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateTaskDto,
  PaginatedTaskResponseDto,
  TaskResponseDto,
  TaskStatus,
  UpdateTaskDto,
} from '../../../types/api';
import { API_ENDPOINTS } from '@constants/api';

export interface TasksListQuery {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  assignedToId?: string;
  q?: string;
  dueBefore?: string;
  dueAfter?: string;
}

@Service()
export class Tasks {
  private readonly http = inject(HttpClient);

  findAll(projectId: string, query: TasksListQuery = {}): Observable<PaginatedTaskResponseDto> {
    const url = API_ENDPOINTS.projects.tasks(projectId);
    let params = new HttpParams();

    if (query.page != null) {
      params = params.set('page', String(query.page));
    }
    if (query.limit != null) {
      params = params.set('limit', String(query.limit));
    }
    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.assignedToId) {
      params = params.set('assignedToId', query.assignedToId);
    }
    if (query.q) {
      params = params.set('q', query.q);
    }
    if (query.dueBefore) {
      params = params.set('dueBefore', query.dueBefore);
    }
    if (query.dueAfter) {
      params = params.set('dueAfter', query.dueAfter);
    }

    return this.http.get<PaginatedTaskResponseDto>(url, { params });
  }

  findMine(
    query: { page?: number; limit?: number; includeDone?: boolean } = {}
  ): Observable<PaginatedTaskResponseDto> {
    let params = new HttpParams();
    if (query.page != null) {
      params = params.set('page', String(query.page));
    }
    if (query.limit != null) {
      params = params.set('limit', String(query.limit));
    }
    if (query.includeDone) {
      params = params.set('includeDone', 'true');
    }
    return this.http.get<PaginatedTaskResponseDto>(API_ENDPOINTS.users.meTasks, { params });
  }

  create(projectId: string, dto: CreateTaskDto): Observable<TaskResponseDto> {
    const url = API_ENDPOINTS.projects.tasks(projectId);
    return this.http.post<TaskResponseDto>(url, dto);
  }

  findOne(id: string): Observable<TaskResponseDto> {
    const url = API_ENDPOINTS.tasks.byId(id);
    return this.http.get<TaskResponseDto>(url);
  }

  update(id: string, dto: UpdateTaskDto): Observable<TaskResponseDto> {
    const url = API_ENDPOINTS.tasks.byId(id);
    return this.http.patch<TaskResponseDto>(url, dto);
  }

  softDelete(id: string): Observable<TaskResponseDto> {
    const url = API_ENDPOINTS.tasks.byId(id);
    return this.http.delete<TaskResponseDto>(url);
  }
}
