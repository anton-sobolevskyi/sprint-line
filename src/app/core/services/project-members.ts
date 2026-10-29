import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AddProjectMemberDto,
  PaginatedProjectMemberResponseDto,
  ProjectMemberResponseDto,
  UpdateProjectMemberDto,
} from '@types';
import { API_ENDPOINTS } from '@constants/api';

@Service()
export class ProjectMembers {
  private readonly http = inject(HttpClient);

  findAll(
    projectId: string,
    query: {
      page?: number;
      limit?: number;
    } = {}
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

  add(projectId: string, dto: AddProjectMemberDto): Observable<ProjectMemberResponseDto> {
    const url = API_ENDPOINTS.projects.members(projectId);
    return this.http.post<ProjectMemberResponseDto>(url, dto);
  }

  updateRole(
    projectId: string,
    userId: string,
    dto: UpdateProjectMemberDto
  ): Observable<ProjectMemberResponseDto> {
    const url = API_ENDPOINTS.projects.member(projectId, userId);
    return this.http.patch<ProjectMemberResponseDto>(url, dto);
  }

  remove(projectId: string, userId: string): Observable<ProjectMemberResponseDto> {
    const url = API_ENDPOINTS.projects.member(projectId, userId);
    return this.http.delete<ProjectMemberResponseDto>(url);
  }

  transferOwnership(projectId: string, userId: string): Observable<ProjectMemberResponseDto> {
    const url = API_ENDPOINTS.projects.transferOwnership(projectId, userId);
    return this.http.post<ProjectMemberResponseDto>(url, null);
  }
}
