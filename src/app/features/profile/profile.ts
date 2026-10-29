import { Component, computed, effect, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import {
  HlmField,
  HlmFieldDescription,
  HlmFieldError,
  HlmFieldLabel,
} from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { z } from 'zod';

import { Store } from '@ngrx/store';
import { UsersApiService } from '../../core/users/users-api.service';
import { AuthApiService } from '../../core/auth/auth-api.service';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { Router } from '@angular/router';
import { ConfirmDialogService } from '../../core/ui/confirm-dialog.service';
import {
  selectCurrentUser,
  selectLoadError,
  selectLoadStatus,
} from '../../core/users/user.reducer';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { UserActions } from '../../core/users/user.actions';
import { appToast } from '../../core/ui/toast';
import { getApiErrorMessage } from '../../core/api/api-error';
import { UI_MESSAGES } from '../../core/ui/ui.messages';
import { PASSWORD_LETTER_AND_NUMBER, PROFILE_MESSAGES } from '../../constants';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { firstFieldErrorMessage } from '../../utils';

const messages = PROFILE_MESSAGES.validation;

export const profileDetailsSchema = z.object({
  name: z
    .string()
    .min(1, { message: messages.nameRequired })
    .min(2, { message: messages.nameMinLength }),
  email: z
    .string()
    .min(1, { message: messages.emailRequired })
    .email({ message: messages.emailInvalid }),
  /** Required by API when email changes; optional otherwise. */
  currentPassword: z.string(),
});

export type ProfileDetailsModel = z.infer<typeof profileDetailsSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: messages.currentPasswordRequired }),
    newPassword: z
      .string()
      .min(1, { message: messages.newPasswordRequired })
      .min(8, { message: messages.newPasswordMinLength })
      .regex(PASSWORD_LETTER_AND_NUMBER, {
        message: messages.newPasswordPattern,
      }),
    confirmPassword: z.string().min(1, { message: messages.confirmRequired }),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: PROFILE_MESSAGES.passwordSection.mismatch,
    path: ['confirmPassword'],
  });

export type ChangePasswordModel = z.infer<typeof changePasswordSchema>;

@Component({
  imports: [
    HlmButton,
    HlmField,
    HlmFieldDescription,
    HlmFieldError,
    HlmFieldLabel,
    HlmInput,
    FormField,
    HlmSkeletonImports,
  ],
  selector: 'sl-profile',
  styleUrl: './profile.scss',
  templateUrl: './profile.html',
})
export class Profile {
  private readonly store = inject(Store);
  private readonly usersApi = inject(UsersApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly messages = PROFILE_MESSAGES;

  readonly currentUser = this.store.selectSignal(selectCurrentUser);
  readonly loadStatus = this.store.selectSignal(selectLoadStatus);
  readonly loadError = this.store.selectSignal(selectLoadError);

  readonly detailsShowErrors = signal(false);
  readonly detailsSubmitting = signal(false);
  readonly detailsServerError = signal<string | null>(null);
  readonly detailsSuccess = signal<string | null>(null);

  readonly passwordShowErrors = signal(false);
  readonly passwordSubmitting = signal(false);
  readonly passwordServerError = signal<string | null>(null);

  readonly avatarUploading = signal(false);
  readonly avatarError = signal<string | null>(null);
  readonly avatarSuccess = signal<string | null>(null);
  /** Signed download URL for current avatar, if any. */
  readonly avatarUrl = signal<string | null>(null);

  readonly deleteSubmitting = signal(false);
  readonly deleteError = signal<string | null>(null);
  readonly deletePassword = signal('');

  readonly resendSubmitting = signal(false);
  readonly resendError = signal<string | null>(null);
  readonly resendSuccess = signal<string | null>(null);

  private readonly detailsModel = signal<ProfileDetailsModel>({
    name: '',
    email: '',
    currentPassword: '',
  });

  readonly detailsForm = form(this.detailsModel, (schemaPath) => {
    validateStandardSchema(schemaPath, profileDetailsSchema);
  });

  private readonly passwordModel = signal<ChangePasswordModel>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  readonly passwordForm = form(this.passwordModel, (schemaPath) => {
    validateStandardSchema(schemaPath, changePasswordSchema);
  });

  private readonly syncedUserId = signal<string | null>(null);
  private readonly loadedAvatarId = signal<string | null>(null);

  readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return '?';
    }
    const name = user.name?.trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    const email = user.email ?? '';
    return email.length >= 2 ? email.slice(0, 2).toUpperCase() : '?';
  });

  /** True when the email field differs from the loaded user (API needs password). */
  readonly emailChanged = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return false;
    }
    return this.detailsModel().email.trim().toLowerCase() !== user.email.trim().toLowerCase();
  });

  constructor() {
    this.store.dispatch(UserActions.loadMe());

    effect(() => {
      const user = this.currentUser();
      if (!user || this.syncedUserId() === user.id) {
        return;
      }
      this.syncedUserId.set(user.id);
      this.detailsModel.set({ name: user.name, email: user.email, currentPassword: '' });
    });

    effect(() => {
      const avatarId = this.currentUser()?.avatarId ?? null;
      if (!avatarId) {
        this.avatarUrl.set(null);
        this.loadedAvatarId.set(null);
        return;
      }
      if (this.loadedAvatarId() === avatarId && this.avatarUrl()) {
        return;
      }
      this.loadedAvatarId.set(avatarId);
      this.usersApi.getAttachmentDownloadUrl(avatarId).subscribe({
        next: (response) => {
          if (this.loadedAvatarId() === avatarId) {
            this.avatarUrl.set(response.url ?? null);
          }
        },
        error: () => {
          if (this.loadedAvatarId() === avatarId) {
            this.avatarUrl.set(null);
          }
        },
      });
    });
  }

  isEmailVerified(): boolean {
    const verifiedAt = this.currentUser()?.emailVerifiedAt;
    return verifiedAt != null && verifiedAt.length > 0;
  }

  reload(): void {
    this.store.dispatch(UserActions.loadMe());
  }

  detailsFieldError(field: 'name' | 'email' | 'currentPassword'): string | null {
    const state = this.detailsForm[field]();
    if (!this.detailsShowErrors() && !state.touched()) {
      return null;
    }
    return firstFieldErrorMessage(state.errors());
  }

  passwordFieldError(field: 'currentPassword' | 'newPassword' | 'confirmPassword'): string | null {
    const state = this.passwordForm[field]();
    if (!this.passwordShowErrors() && !state.touched()) {
      return null;
    }
    return firstFieldErrorMessage(state.errors());
  }

  onSaveDetails(event: Event): void {
    event.preventDefault();
    this.detailsServerError.set(null);
    this.detailsSuccess.set(null);
    this.detailsShowErrors.set(true);

    if (this.detailsForm().invalid() || this.detailsSubmitting()) {
      return;
    }

    const user = this.currentUser();
    const { name, email, currentPassword } = this.detailsModel();
    const emailChanged = !!user && email.trim().toLowerCase() !== user.email.trim().toLowerCase();

    if (emailChanged && !(currentPassword ?? '').trim()) {
      this.detailsServerError.set(this.messages.validation.currentPasswordRequiredForEmail);
      return;
    }

    this.detailsSubmitting.set(true);
    const dto = {
      name,
      email,
      ...(emailChanged ? { currentPassword: (currentPassword ?? '').trim() } : {}),
    };

    this.usersApi.updateMe(dto).subscribe({
      next: (nextUser) => {
        this.detailsSubmitting.set(false);
        this.syncedUserId.set(null);
        this.store.dispatch(UserActions.setCurrentUser({ user: nextUser }));
        this.detailsModel.update((m) => ({ ...m, currentPassword: '' }));
        this.detailsSuccess.set(this.messages.profileSection.success);
        appToast.success(this.messages.profileSection.success);
      },
      error: (error: unknown) => {
        this.detailsSubmitting.set(false);
        this.detailsServerError.set(getApiErrorMessage(error));
      },
    });
  }

  onResendVerification(): void {
    if (this.resendSubmitting() || this.isEmailVerified()) {
      return;
    }

    this.resendError.set(null);
    this.resendSuccess.set(null);
    this.resendSubmitting.set(true);

    this.authApi.resendVerification().subscribe({
      next: () => {
        this.resendSubmitting.set(false);
        this.resendSuccess.set(this.messages.profileSection.resendSuccess);
        appToast.success(this.messages.profileSection.resendSuccess);
      },
      error: (error: unknown) => {
        this.resendSubmitting.set(false);
        this.resendError.set(getApiErrorMessage(error));
      },
    });
  }

  onChangePassword(event: Event): void {
    event.preventDefault();
    this.passwordServerError.set(null);
    this.passwordShowErrors.set(true);

    if (this.passwordForm().invalid() || this.passwordSubmitting()) {
      return;
    }

    this.passwordSubmitting.set(true);
    const { currentPassword, newPassword } = this.passwordModel();

    this.usersApi.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.passwordSubmitting.set(false);
        this.authSession.clearSession();
        void this.router.navigateByUrl('/login');
      },
      error: (error: unknown) => {
        this.passwordSubmitting.set(false);
        this.passwordServerError.set(getApiErrorMessage(error));
      },
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file || this.avatarUploading()) {
      return;
    }

    this.avatarError.set(null);
    this.avatarSuccess.set(null);
    this.avatarUploading.set(true);

    this.usersApi.uploadAvatar(file).subscribe({
      next: () => {
        this.avatarUploading.set(false);
        this.avatarSuccess.set(this.messages.avatarSection.success);
        appToast.success(this.messages.avatarSection.success);
        this.loadedAvatarId.set(null);
        this.store.dispatch(UserActions.loadMe());
      },
      error: (error: unknown) => {
        this.avatarUploading.set(false);
        this.avatarError.set(getApiErrorMessage(error));
      },
    });
  }

  onDeletePasswordInput(event: Event): void {
    this.deletePassword.set((event.target as HTMLInputElement).value);
  }

  async onDeleteAccount(): Promise<void> {
    if (this.deleteSubmitting()) {
      return;
    }

    const password = this.deletePassword().trim();
    if (!password) {
      this.deleteError.set(this.messages.validation.currentPasswordRequired);
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: this.messages.deleteSection.dialogTitle,
      description: this.messages.deleteSection.dialogBody,
      confirmLabel: UI_MESSAGES.dialog.delete,
      destructive: true,
    });
    if (!confirmed) {
      return;
    }

    this.deleteError.set(null);
    this.deleteSubmitting.set(true);

    this.usersApi.deleteMe({ currentPassword: password }).subscribe({
      next: () => {
        this.deleteSubmitting.set(false);
        this.authSession.clearSession();
        appToast.success(this.messages.deleteSection.confirm);
        void this.router.navigateByUrl('/login');
      },
      error: (error: unknown) => {
        this.deleteSubmitting.set(false);
        this.deleteError.set(getApiErrorMessage(error));
        appToast.error(getApiErrorMessage(error));
      },
    });
  }
}
