import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import type { components } from '../../../types/api.schema';
import { API_ENDPOINTS } from '../api/api-endpoints';

export type ProjectResponseDto = components['schemas']['ProjectResponseDto'];
export type CreateProjectDto = components['schemas']['CreateProjectDto'];
export type UpdateProjectDto = components['schemas']['UpdateProjectDto'];
export type PaginatedProjectResponseDto =
  components['schemas']['PaginatedProjectResponseDto'];
export type PaginationMetaDto = components['schemas']['PaginationMetaDto'];

export interface ProjectsListQuery {
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectsApiService {
  private readonly http = inject(HttpClient);

  /**
   * GET /projects — paginated list (`PaginatedProjectResponseDto`).
   * Each item may include up to 20 members plus `memberCount`.
   */
  findAll(query: ProjectsListQuery = {}): Observable<PaginatedProjectResponseDto> {
    const url = API_ENDPOINTS.projects.list;
    let params = new HttpParams();

    if (query.page != null) {
      params = params.set('page', String(query.page));
    }
    if (query.limit != null) {
      params = params.set('limit', String(query.limit));
    }

    return this.http.get<PaginatedProjectResponseDto>(url, { params });
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
