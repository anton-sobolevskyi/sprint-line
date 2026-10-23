import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import type { components } from '../../../types/api.schema';
import { API_ENDPOINTS } from '../api/api-endpoints';

export type CommentResponseDto = components['schemas']['CommentResponseDto'];
export type CreateCommentDto = components['schemas']['CreateCommentDto'];
export type UpdateCommentDto = components['schemas']['UpdateCommentDto'];
export type PaginatedCommentResponseDto =
  components['schemas']['PaginatedCommentResponseDto'];

export interface CommentsListQuery {
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class CommentsApiService {
  private readonly http = inject(HttpClient);

  findAll(
    taskId: string,
    query: CommentsListQuery = {},
  ): Observable<PaginatedCommentResponseDto> {
    const url = API_ENDPOINTS.tasks.comments(taskId);
    let params = new HttpParams();

    if (query.page != null) {
      params = params.set('page', String(query.page));
    }
    if (query.limit != null) {
      params = params.set('limit', String(query.limit));
    }

    return this.http.get<PaginatedCommentResponseDto>(url, { params });
  }

  create(taskId: string, dto: CreateCommentDto): Observable<CommentResponseDto> {
    const url = API_ENDPOINTS.tasks.comments(taskId);
    return this.http.post<CommentResponseDto>(url, dto);
  }

  findOne(id: string): Observable<CommentResponseDto> {
    const url = API_ENDPOINTS.comments.byId(id);
    return this.http.get<CommentResponseDto>(url);
  }

  update(id: string, dto: UpdateCommentDto): Observable<CommentResponseDto> {
    const url = API_ENDPOINTS.comments.byId(id);
    return this.http.patch<CommentResponseDto>(url, dto);
  }

  softDelete(id: string): Observable<CommentResponseDto> {
    const url = API_ENDPOINTS.comments.byId(id);
    return this.http.delete<CommentResponseDto>(url);
  }
}
