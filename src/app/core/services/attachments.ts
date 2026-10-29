import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AttachmentResponseDto, DownloadUrlResponseDto } from '../../../types/api';
import { API_ENDPOINTS } from '@constants/api';

@Service()
export class Attachments {
  private readonly http = inject(HttpClient);

  findAllForTask(taskId: string): Observable<AttachmentResponseDto[]> {
    const url = API_ENDPOINTS.tasks.attachments(taskId);
    return this.http.get<AttachmentResponseDto[]>(url);
  }

  uploadForTask(taskId: string, file: File): Observable<AttachmentResponseDto> {
    const url = API_ENDPOINTS.tasks.attachments(taskId);
    const body = new FormData();
    body.append('file', file);
    return this.http.post<AttachmentResponseDto>(url, body);
  }

  uploadForComment(commentId: string, file: File): Observable<AttachmentResponseDto> {
    const url = API_ENDPOINTS.comments.attachments(commentId);
    const body = new FormData();
    body.append('file', file);
    return this.http.post<AttachmentResponseDto>(url, body);
  }

  getDownloadUrl(id: string): Observable<DownloadUrlResponseDto> {
    const url = API_ENDPOINTS.attachments.downloadUrl(id);
    return this.http.get<DownloadUrlResponseDto>(url);
  }

  remove(id: string): Observable<AttachmentResponseDto> {
    const url = API_ENDPOINTS.attachments.byId(id);
    return this.http.delete<AttachmentResponseDto>(url);
  }
}
