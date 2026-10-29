import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import {
  HlmSidebar,
  HlmSidebarContent,
  HlmSidebarFooter,
  HlmSidebarGroup,
  HlmSidebarGroupContent,
  HlmSidebarGroupLabel,
  HlmSidebarHeader,
  HlmSidebarInset,
  HlmSidebarMenu,
  HlmSidebarMenuButton,
  HlmSidebarMenuItem,
  HlmSidebarRail,
  HlmSidebarTrigger,
  HlmSidebarWrapper,
} from '@spartan-ng/helm/sidebar';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../core/users/user.reducer';
import { UserActions } from '../../core/users/user.actions';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { appToast } from '../../core/ui/toast';
import { Commands } from '../../components/commands/commands';
import {
  lucideFolderKanban,
  lucideHouse,
  lucideLogOut,
  lucideMoon,
  lucideSearch,
  lucideSun,
  lucideUserRound,
  lucideX,
} from '@ng-icons/lucide';
import { Projects } from '@core/services/projects';
import { ProjectResponseDto } from '@types';
import { getApiErrorMessage } from '@utils';
import { Users } from '@core/services/users';
import { Auth } from '@core/services/auth';
import { SHELL_MESSAGES } from '@constants/messages';
import { CommandPalette } from '@core/services/command-palette';
import { Theme } from '@core/services/theme';
import { BrandMark } from '../../components/brand-mark/brand-mark';

@Component({
  imports: [
    BrandMark,
    HlmButton,
    HlmSidebar,
    HlmSidebarContent,
    HlmSidebarFooter,
    HlmSidebarGroup,
    HlmSidebarGroupContent,
    HlmSidebarGroupLabel,
    HlmSidebarHeader,
    HlmSidebarInset,
    HlmSidebarMenu,
    HlmSidebarMenuButton,
    HlmSidebarMenuItem,
    HlmSidebarRail,
    HlmSidebarTrigger,
    HlmSidebarWrapper,
    NgIcon,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    Commands,
  ],
  selector: 'sl-main-layout',
  styleUrl: './main-layout.scss',
  templateUrl: './main-layout.html',
  providers: [
    provideIcons({
      lucideHouse,
      lucideFolderKanban,
      lucideSun,
      lucideMoon,
      lucideLogOut,
      lucideSearch,
      lucideX,
      lucideUserRound,
    }),
  ],
})
export class MainLayout {
  private readonly authApi = inject(Auth);
  private readonly projectsApi = inject(Projects);
  private readonly usersApi = inject(Users);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(Theme);
  readonly commandPalette = inject(CommandPalette);

  readonly messages = SHELL_MESSAGES;
  readonly isLoggingOut = signal(false);
  readonly currentUser = this.store.selectSignal(selectCurrentUser);

  readonly resendSubmitting = signal(false);

  readonly activeProjectId = signal<string | null>(null);
  readonly activeProjectName = signal<string | null>(null);

  readonly recentProjects = signal<ProjectResponseDto[]>([]);

  readonly avatarUrl = signal<string | null>(null);
  private readonly loadedAvatarId = signal<string | null>(null);

  /** Stable callback for the command palette Sign out action. */
  readonly signOutAction = (): void => {
    this.logout();
  };

  /** Platform-aware shortcut label: Ctrl K on Windows/Linux, ⌘K on Apple devices. */
  readonly shortcutHint =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent)
      ? this.messages.commandPalette.triggerHintMac
      : this.messages.commandPalette.triggerHint;

  readonly verifyDismissed = signal(false);

  readonly needsEmailVerification = computed(() => {
    const user = this.currentUser();
    if (!user || this.verifyDismissed()) {
      return false;
    }
    const verifiedAt = user.emailVerifiedAt;
    return verifiedAt == null || verifiedAt.length === 0;
  });

  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return '';
    }
    return user.name?.trim() || user.email || '';
  });

  readonly userInitials = computed(() => {
    const name = this.userDisplayName();
    if (!name) {
      return '?';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  readonly themeLabel = computed(() => {
    const mode = this.theme.mode();
    if (mode === 'dark') {
      return this.messages.theme.dark;
    }
    if (mode === 'light') {
      return this.messages.theme.light;
    }
    return this.messages.theme.system;
  });

  constructor() {
    if (!this.currentUser()) {
      this.store.dispatch(UserActions.loadMe());
    }

    this.loadRecentProjects();
    this.syncProjectContext(this.router.url);

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

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.syncProjectContext(event.urlAfterRedirects);
        if (
          event.urlAfterRedirects === '/projects' ||
          event.urlAfterRedirects.startsWith('/projects/')
        ) {
          this.loadRecentProjects();
        }
      });
  }

  openCommandPalette(): void {
    this.commandPalette.show();
  }

  private loadRecentProjects(): void {
    this.projectsApi.findAll({ page: 1, limit: 5 }).subscribe({
      next: (response) => {
        this.recentProjects.set(response.data ?? []);
      },
      error: () => {
        // Non-blocking
      },
    });
  }

  private syncProjectContext(url: string): void {
    const match =
      url.match(/^\/projects\/([^/]+)(?:\/tasks\/[^/]+)?(?:\?.*)?$/) ??
      url.match(/^\/projects\/([^/]+)/);
    const id = match?.[1] && match[1] !== 'new' ? match[1] : null;

    if (!id) {
      this.activeProjectId.set(null);
      this.activeProjectName.set(null);
      return;
    }

    if (this.activeProjectId() === id && this.activeProjectName()) {
      return;
    }

    this.activeProjectId.set(id);

    const fromRecent = this.recentProjects().find((p) => p.id === id);
    if (fromRecent) {
      this.activeProjectName.set(fromRecent.name);
    }

    this.projectsApi.findOne(id).subscribe({
      next: (project) => {
        if (this.activeProjectId() === id) {
          this.activeProjectName.set(project.name);
        }
      },
      error: () => {
        if (this.activeProjectId() === id && !fromRecent) {
          this.activeProjectName.set(null);
        }
      },
    });
  }

  toggleTheme(): void {
    this.theme.toggleLightDark();
  }

  resendVerification(): void {
    if (this.resendSubmitting() || !this.needsEmailVerification()) {
      return;
    }

    this.resendSubmitting.set(true);
    this.authApi.resendVerification().subscribe({
      next: () => {
        this.resendSubmitting.set(false);
        appToast.success(this.messages.verify.success);
      },
      error: (error: unknown) => {
        this.resendSubmitting.set(false);
        appToast.error(getApiErrorMessage(error));
      },
    });
  }

  logout(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);
    this.authApi.logout().subscribe({
      next: () => {
        this.isLoggingOut.set(false);
        void this.router.navigateByUrl('/login');
      },
      error: () => {
        this.isLoggingOut.set(false);
        void this.router.navigateByUrl('/login');
      },
    });
  }
}
