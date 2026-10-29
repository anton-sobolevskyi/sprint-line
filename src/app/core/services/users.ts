import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '@constants/api';
import {
  AttachmentResponseDto,
  ChangePasswordDto,
  DeleteAccountDto,
  DownloadUrlResponseDto,
  UpdateUserDto,
  UserResponseDto,
} from '@types';

@Service()
export class Users {
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

  /** Soft-delete account; body must include currentPassword (API schema). */
  deleteMe(dto: DeleteAccountDto): Observable<UserResponseDto> {
    const url = API_ENDPOINTS.users.me;
    return this.http.delete<UserResponseDto>(url, { body: dto });
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
