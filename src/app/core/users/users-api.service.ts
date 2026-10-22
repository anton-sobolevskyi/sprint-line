import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import type { components } from '../../../types/api.schema';
import { API_ENDPOINTS } from '../api/api-endpoints';

export type UserResponseDto = components['schemas']['UserResponseDto'];
export type UpdateUserDto = components['schemas']['UpdateUserDto'];
export type ChangePasswordDto = components['schemas']['ChangePasswordDto'];
export type AttachmentResponseDto = components['schemas']['AttachmentResponseDto'];
export type DownloadUrlResponseDto = components['schemas']['DownloadUrlResponseDto'];

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);

  getMe(): Observable<UserResponseDto> {
    const url = API_ENDPOINTS.users.me;
    return this.http.get<UserResponseDto>(url);
  }

  updateMe(dto: UpdateUserDto): Observable<UserResponseDto> {
    const url = API_ENDPOINTS.users.me;
    return this.http.patch<UserResponseDto>(url, dto);
  }

  changePassword(dto: ChangePasswordDto): Observable<void> {
    const url = API_ENDPOINTS.users.mePassword;
    return this.http.patch<void>(url, dto);
  }

  deleteMe(): Observable<UserResponseDto> {
    const url = API_ENDPOINTS.users.me;
    return this.http.delete<UserResponseDto>(url);
  }

  /** Multipart upload; field name `file` matches typical Nest Multer config. */
  uploadAvatar(file: File): Observable<AttachmentResponseDto> {
    const url = API_ENDPOINTS.users.avatar;
    const body = new FormData();
    body.append('file', file);
    return this.http.post<AttachmentResponseDto>(url, body);
  }

  getAttachmentDownloadUrl(id: string): Observable<DownloadUrlResponseDto> {
    const url = API_ENDPOINTS.attachments.downloadUrl(id);
    return this.http.get<DownloadUrlResponseDto>(url);
  }
}
