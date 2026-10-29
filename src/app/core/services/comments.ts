import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CommentResponseDto,
  CreateCommentDto,
  PaginatedCommentResponseDto,
  UpdateCommentDto,
} from '@types';
import { API_ENDPOINTS } from '@constants/api';

@Service()
export class Comments {
  private readonly http = inject(HttpClient);

  findAll(
    taskId: string,
    query: { page?: number; limit?: number } = {}
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
