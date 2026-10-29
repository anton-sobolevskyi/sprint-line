import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { ProjectMembersStore } from './project-members.store';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { selectCurrentUser } from '../../../core/users/user.reducer';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { UserActions } from '../../../core/users/user.actions';
import { firstFieldErrorMessage } from '../../../utils';
import { appToast } from '../../../core/ui/toast';
import { UI_MESSAGES } from '../../../core/ui/ui.messages';
import { InviteMemberModel, inviteMemberSchema } from './project-members.schema';
import { ProjectMemberResponseDto, ProjectMemberRole } from '@types';
import { MEMBERS_MESSAGES } from '@constants/messages';
import { Dialog } from '@core/services/dialog';

@Component({
  imports: [
    HlmButton,
    HlmField,
    HlmFieldError,
    HlmFieldLabel,
    HlmInput,
    HlmSelectImports,
    FormField,
  ],
  selector: 'sl-project-members',
  styleUrl: './project-members.scss',
  templateUrl: './project-members.html',
  providers: [ProjectMembersStore],
})
export class ProjectMembers {
  readonly projectId = input.required<string>();

  private readonly membersStore = inject(ProjectMembersStore);
  private readonly ngrxStore = inject(Store);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);

  readonly messages = MEMBERS_MESSAGES;
  readonly assignableRoles = ['MEMBER', 'ADMIN'] as const satisfies readonly ProjectMemberRole[];
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

  /** Optimistic role shown while a change request is in flight. Cleared on error or once the list matches. */
  private readonly pendingRoles = signal<Readonly<Record<string, ProjectMemberRole>>>({});

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
  readonly inviteRole = computed(() => this.inviteModel().role);

  readonly roleToString = (value: unknown): string => {
    if (value === 'OWNER' || value === 'ADMIN' || value === 'MEMBER') {
      return this.roleLabel(value);
    }
    return '';
  };

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

    effect(() => {
      const members = this.members();
      const pending = this.pendingRoles();
      const settled = Object.keys(pending).filter((userId) => {
        const member = members.find((item) => item.userId === userId);
        return !member || member.role === pending[userId];
      });
      if (settled.length === 0) {
        return;
      }
      this.pendingRoles.update((current) => {
        const next = { ...current };
        for (const userId of settled) {
          delete next[userId];
        }
        return next;
      });
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

  roleValue(member: ProjectMemberResponseDto): ProjectMemberRole {
    return this.pendingRoles()[member.userId] ?? member.role;
  }

  setInviteRole(value: unknown): void {
    if (value === 'ADMIN' || value === 'MEMBER') {
      this.inviteModel.update((current) => ({ ...current, role: value }));
    }
  }

  onRoleChange(member: ProjectMemberResponseDto, value: unknown): void {
    if (!this.canManageMembers() || this.isSelf(member)) {
      return;
    }

    if (value !== 'MEMBER' && value !== 'ADMIN') {
      return;
    }

    if (value === member.role || this.pendingRoles()[member.userId] === value) {
      return;
    }

    this.pendingRoles.update((current) => ({ ...current, [member.userId]: value }));

    this.membersStore.updateRole(member, value, {
      onError: () => {
        this.pendingRoles.update((current) => {
          const next = { ...current };
          delete next[member.userId];
          return next;
        });
      },
    });
  }

  async onRemove(member: ProjectMemberResponseDto): Promise<void> {
    const self = this.isSelf(member);
    if (!self && !this.canManageMembers()) {
      return;
    }

    const confirmed = await this.dialog.confirm({
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

    const confirmed = await this.dialog.confirm({
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
