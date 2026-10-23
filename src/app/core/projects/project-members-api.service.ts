import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import type { components } from '../../../types/api.schema';
import { API_ENDPOINTS } from '../api/api-endpoints';

export type ProjectMemberResponseDto =
  components['schemas']['ProjectMemberResponseDto'];
export type PaginatedProjectMemberResponseDto =
  components['schemas']['PaginatedProjectMemberResponseDto'];
export type AddProjectMemberDto = components['schemas']['AddProjectMemberDto'];
export type UpdateProjectMemberDto =
  components['schemas']['UpdateProjectMemberDto'];
export type ProjectMemberRole = ProjectMemberResponseDto['role'];

export interface ProjectMembersListQuery {
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectMembersApiService {
  private readonly http = inject(HttpClient);

  findAll(
    projectId: string,
    query: ProjectMembersListQuery = {},
  ): Observable<PaginatedProjectMemberResponseDto> {
    const url = API_ENDPOINTS.projects.members(projectId);
    let params = new HttpParams();

    if (query.page != null) {
      params = params.set('page', String(query.page));
    }
    if (query.limit != null) {
      params = params.set('limit', String(query.limit));
    }

    return this.http.get<PaginatedProjectMemberResponseDto>(url, { params });
  }

  add(
    projectId: string,
    dto: AddProjectMemberDto,
  ): Observable<ProjectMemberResponseDto> {
    const url = API_ENDPOINTS.projects.members(projectId);
    return this.http.post<ProjectMemberResponseDto>(url, dto);
  }

  updateRole(
    projectId: string,
    userId: string,
    dto: UpdateProjectMemberDto,
  ): Observable<ProjectMemberResponseDto> {
    const url = API_ENDPOINTS.projects.member(projectId, userId);
    return this.http.patch<ProjectMemberResponseDto>(url, dto);
  }

  remove(
    projectId: string,
    userId: string,
  ): Observable<ProjectMemberResponseDto> {
    const url = API_ENDPOINTS.projects.member(projectId, userId);
    return this.http.delete<ProjectMemberResponseDto>(url);
  }

  transferOwnership(
    projectId: string,
    userId: string,
  ): Observable<ProjectMemberResponseDto> {
    const url = API_ENDPOINTS.projects.transferOwnership(projectId, userId);
    return this.http.post<ProjectMemberResponseDto>(url, null);
  }
}
