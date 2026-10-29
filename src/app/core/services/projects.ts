import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateProjectDto,
  PaginatedProjectResponseDto,
  ProjectResponseDto,
  UpdateProjectDto,
} from '@types';
import { API_ENDPOINTS } from '@constants/api';

@Service()
export class Projects {
  private readonly http = inject(HttpClient);

  findAll(
    query: {
      page?: number;
      limit?: number;
    } = {}
  ): Observable<PaginatedProjectResponseDto> {
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
