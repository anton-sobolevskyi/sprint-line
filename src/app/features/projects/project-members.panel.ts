import { Component, computed, inject, input, OnChanges, signal, SimpleChanges } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';

import { getApiErrorMessage } from '../../core/api/api-error';
import {
  type ProjectMemberResponseDto,
  type ProjectMemberRole,
  ProjectMembersApiService,
} from '../../core/projects/project-members-api.service';
import { selectCurrentUser } from '../../core/users/user.reducer';
import { UserActions } from '../../core/users/user.actions';
import { firstFieldErrorMessage } from '../auth/auth.form-utils';
import { MEMBERS_MESSAGES } from './members.messages';
import { inviteMemberSchema, type InviteMemberModel } from './members.schemas';

const DEFAULT_PAGE = 1 as const;
const DEFAULT_LIMIT = 50 as const;

@Component({
  selector: 'sl-project-members-panel',
  imports: [
    FormField,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
  ],
  templateUrl: './project-members.panel.html',
})
export class ProjectMembersPanel implements OnChanges {
  readonly projectId = input.required<string>();

  private readonly membersApi = inject(ProjectMembersApiService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  readonly messages = MEMBERS_MESSAGES;
  readonly currentUser = this.store.selectSignal(selectCurrentUser);

  readonly members = signal<ProjectMemberResponseDto[]>([]);
  readonly loadStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly loadError = signal<string | null>(null);

  readonly inviteShowErrors = signal(false);
  readonly inviteSubmitting = signal(false);
  readonly inviteServerError = signal<string | null>(null);
  readonly inviteSuccess = signal<string | null>(null);

  readonly actionUserId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  private readonly inviteModel = signal<InviteMemberModel>({
    email: '',
    role: 'MEMBER',
  });

  readonly inviteForm = form(this.inviteModel, (schemaPath) => {
    validateStandardSchema(schemaPath, inviteMemberSchema);
  });

  readonly myMembership = computed(() => {
    const me = this.currentUser();
    if (!me) {
      return null;
    }
    return this.members().find((member) => member.userId === me.id) ?? null;
  });

  readonly canManageMembers = computed(() => {
    const role = this.myMembership()?.role;
    return role === 'OWNER' || role === 'ADMIN';
  });

  readonly isOwner = computed(() => this.myMembership()?.role === 'OWNER');

  constructor() {
    if (!this.currentUser()) {
      this.store.dispatch(UserActions.loadMe());
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.projectId()) {
      this.load();
    }
  }

  load(page: number = DEFAULT_PAGE): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    this.loadStatus.set('loading');
    this.loadError.set(null);

    this.membersApi.findAll(projectId, { page, limit: DEFAULT_LIMIT }).subscribe({
      next: (response) => {
        this.members.set(response.data);
        this.loadStatus.set('success');
      },
      error: (error: unknown) => {
        this.loadStatus.set('error');
        this.loadError.set(getApiErrorMessage(error));
      },
    });
  }

  displayName(member: ProjectMemberResponseDto): string {
    return member.user?.name ?? member.userId;
  }

  displayEmail(member: ProjectMemberResponseDto): string {
    return member.user?.email ?? '—';
  }

  roleLabel(role: ProjectMemberRole): string {
    return this.messages.roles[role];
  }

  isSelf(member: ProjectMemberResponseDto): boolean {
    return member.userId === this.currentUser()?.id;
  }

  inviteFieldError(field: 'email' | 'role'): string | null {
    const state = this.inviteForm[field]();
    if (!this.inviteShowErrors() && !state.touched()) {
      return null;
    }
    return firstFieldErrorMessage(state.errors());
  }

  onInviteSubmit(event: Event): void {
    event.preventDefault();
    if (!this.canManageMembers()) {
      return;
    }

    this.inviteServerError.set(null);
    this.inviteSuccess.set(null);
    this.inviteShowErrors.set(true);

    if (this.inviteForm().invalid() || this.inviteSubmitting()) {
      return;
    }

    this.inviteSubmitting.set(true);
    const { email, role } = this.inviteModel();

    this.membersApi.add(this.projectId(), { email, role }).subscribe({
      next: () => {
        this.inviteSubmitting.set(false);
        this.inviteSuccess.set(this.messages.invite.success);
        this.inviteModel.set({ email: '', role: 'MEMBER' });
        this.inviteShowErrors.set(false);
        this.load();
      },
      error: (error: unknown) => {
        this.inviteSubmitting.set(false);
        this.inviteServerError.set(getApiErrorMessage(error));
      },
    });
  }

  onRoleChange(member: ProjectMemberResponseDto, event: Event): void {
    if (!this.canManageMembers() || this.isSelf(member)) {
      return;
    }

    const select = event.target as HTMLSelectElement;
    const role = select.value as ProjectMemberRole;
    if (role === member.role) {
      return;
    }

    // Only OWNER may assign OWNER; prefer transfer endpoint for ownership moves.
    if (role === 'OWNER') {
      select.value = member.role;
      this.onTransfer(member);
      return;
    }

    this.actionError.set(null);
    this.actionUserId.set(member.userId);

    this.membersApi
      .updateRole(this.projectId(), member.userId, { role })
      .subscribe({
        next: () => {
          this.actionUserId.set(null);
          this.load();
        },
        error: (error: unknown) => {
          this.actionUserId.set(null);
          select.value = member.role;
          this.actionError.set(getApiErrorMessage(error));
        },
      });
  }

  onRemove(member: ProjectMemberResponseDto): void {
    const self = this.isSelf(member);
    if (!self && !this.canManageMembers()) {
      return;
    }

    const title = self
      ? this.messages.confirm.leaveTitle
      : this.messages.confirm.removeTitle;
    const body = self
      ? this.messages.confirm.leaveBody
      : this.messages.confirm.removeBody;

    if (!globalThis.confirm(`${title}\n\n${body}`)) {
      return;
    }

    this.actionError.set(null);
    this.actionUserId.set(member.userId);

    this.membersApi.remove(this.projectId(), member.userId).subscribe({
      next: () => {
        this.actionUserId.set(null);
        if (self) {
          void this.router.navigateByUrl('/projects');
          return;
        }
        this.load();
      },
      error: (error: unknown) => {
        this.actionUserId.set(null);
        this.actionError.set(getApiErrorMessage(error));
      },
    });
  }

  onTransfer(member: ProjectMemberResponseDto): void {
    if (!this.isOwner() || this.isSelf(member) || member.role === 'OWNER') {
      return;
    }

    if (
      !globalThis.confirm(
        `${this.messages.confirm.transferTitle}\n\n${this.messages.confirm.transferBody}`,
      )
    ) {
      return;
    }

    this.actionError.set(null);
    this.actionUserId.set(member.userId);

    this.membersApi.transferOwnership(this.projectId(), member.userId).subscribe({
      next: () => {
        this.actionUserId.set(null);
        this.load();
      },
      error: (error: unknown) => {
        this.actionUserId.set(null);
        this.actionError.set(getApiErrorMessage(error));
      },
    });
  }
}
