import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import type { components } from '../../../types/api.schema';
import { API_ENDPOINTS } from '../api/api-endpoints';

export type ProjectResponseDto = components['schemas']['ProjectResponseDto'];
export type CreateProjectDto = components['schemas']['CreateProjectDto'];
export type UpdateProjectDto = components['schemas']['UpdateProjectDto'];

@Injectable({ providedIn: 'root' })
export class ProjectsApiService {
  private readonly http = inject(HttpClient);

  findAll(): Observable<ProjectResponseDto[]> {
    const url = API_ENDPOINTS.projects.list;
    return this.http.get<ProjectResponseDto[]>(url);
  }

  create(dto: CreateProjectDto): Observable<ProjectResponseDto> {
    const url = API_ENDPOINTS.projects.create;
    return this.http.post<ProjectResponseDto>(url, dto);
  }

  findOne(id: string): Observable<ProjectResponseDto> {
    const url = API_ENDPOINTS.projects.byId(id);
    return this.http.get<ProjectResponseDto>(url);
  }

  update(id: string, dto: UpdateProjectDto): Observable<ProjectResponseDto> {
    const url = API_ENDPOINTS.projects.byId(id);
    return this.http.patch<ProjectResponseDto>(url, dto);
  }

  softDelete(id: string): Observable<ProjectResponseDto> {
    const url = API_ENDPOINTS.projects.byId(id);
    return this.http.delete<ProjectResponseDto>(url);
  }
}
