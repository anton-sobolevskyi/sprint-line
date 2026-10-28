import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';

import { ConfirmDialogService } from '../../core/ui/confirm-dialog.service';
import { appToast } from '../../core/ui/toast';
import { UI_MESSAGES } from '../../core/ui/ui.messages';
import {
  type ProjectMemberResponseDto,
  type ProjectMemberRole,
} from '../../core/projects/project-members-api.service';
import { UserActions } from '../../core/users/user.actions';
import { selectCurrentUser } from '../../core/users/user.reducer';
import { firstFieldErrorMessage } from '../auth/auth.form-utils';
import { MEMBERS_MESSAGES } from './members.messages';
import { inviteMemberSchema, type InviteMemberModel } from './members.schemas';
import { ProjectMembersStore } from './project-members.store';

@Component({
  selector: 'sl-project-members-panel',
  providers: [ProjectMembersStore],
  imports: [
    FormField,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
  ],
  templateUrl: './project-members.panel.html',
})
export class ProjectMembersPanel {
  readonly projectId = input.required<string>();

  private readonly membersStore = inject(ProjectMembersStore);
  private readonly ngrxStore = inject(Store);
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly messages = MEMBERS_MESSAGES;
  readonly currentUser = this.ngrxStore.selectSignal(selectCurrentUser);

  readonly members = this.membersStore.members;
  readonly loadStatus = this.membersStore.loadStatus;
  readonly loadError = this.membersStore.loadError;
  readonly actionUserId = this.membersStore.actionUserId;
  readonly actionError = this.membersStore.actionError;

  readonly inviteShowErrors = signal(false);
  readonly inviteSubmitting = signal(false);
  readonly inviteServerError = signal<string | null>(null);
  readonly inviteSuccess = signal<string | null>(null);

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

  private readonly loadedForProjectId = signal<string | null>(null);

  constructor() {
    if (!this.currentUser()) {
      this.ngrxStore.dispatch(UserActions.loadMe());
    }

    effect(() => {
      const projectId = this.projectId();
      if (!projectId || this.loadedForProjectId() === projectId) {
        return;
      }
      this.loadedForProjectId.set(projectId);
      this.membersStore.setProjectId(projectId);
      this.membersStore.load();
    });
  }

  load(): void {
    this.membersStore.load();
  }

  displayName(member: ProjectMemberResponseDto): string {
    return member.user?.name ?? member.userId;
  }

  displayEmail(member: ProjectMemberResponseDto): string {
    return member.user?.email ?? '—';
  }

  memberInitials(member: ProjectMemberResponseDto): string {
    const name = this.displayName(member).trim();
    if (!name || name === member.userId) {
      const email = member.user?.email ?? '';
      if (email.length >= 2) {
        return email.slice(0, 2).toUpperCase();
      }
      return '?';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  roleLabel(role: ProjectMemberRole): string {
    switch (role) {
      case 'OWNER':
        return this.messages.roles.OWNER;
      case 'ADMIN':
        return this.messages.roles.ADMIN;
      case 'MEMBER':
        return this.messages.roles.MEMBER;
      default:
        return String(role);
    }
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

    this.membersStore.invite(
      { email, role },
      {
        onSuccess: () => {
          this.inviteSubmitting.set(false);
          this.inviteSuccess.set(this.messages.invite.success);
          appToast.success(this.messages.invite.success);
          this.inviteModel.set({ email: '', role: 'MEMBER' });
          this.inviteShowErrors.set(false);
        },
        onError: (message) => {
          this.inviteSubmitting.set(false);
          this.inviteServerError.set(message);
        },
      }
    );
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

    this.membersStore.updateRole(member, role, {
      onError: () => {
        select.value = member.role;
      },
    });
  }

  async onRemove(member: ProjectMemberResponseDto): Promise<void> {
    const self = this.isSelf(member);
    if (!self && !this.canManageMembers()) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: self ? this.messages.confirm.leaveTitle : this.messages.confirm.removeTitle,
      description: self ? this.messages.confirm.leaveBody : this.messages.confirm.removeBody,
      confirmLabel: self ? this.messages.actions.leave : UI_MESSAGES.dialog.delete,
      destructive: true,
    });
    if (!confirmed) {
      return;
    }

    this.membersStore.remove(member.userId, {
      onSuccess: () => {
        if (self) {
          appToast.success(this.messages.actions.leave);
          void this.router.navigateByUrl('/projects');
          return;
        }
        appToast.success(this.messages.actions.remove);
      },
      onError: (message) => appToast.error(message),
    });
  }

  async onTransfer(member: ProjectMemberResponseDto): Promise<void> {
    if (!this.isOwner() || this.isSelf(member) || member.role === 'OWNER') {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: this.messages.confirm.transferTitle,
      description: this.messages.confirm.transferBody,
      confirmLabel: this.messages.actions.transfer,
      destructive: false,
    });
    if (!confirmed) {
      return;
    }

    this.membersStore.transferOwnership(member.userId, {
      onSuccess: () => appToast.success(this.messages.actions.transfer),
      onError: (message) => appToast.error(message),
    });
  }
}
