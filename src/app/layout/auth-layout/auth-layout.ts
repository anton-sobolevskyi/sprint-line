import { Component } from '@angular/core';
import { AuthThemeToggle } from '../../features/auth/auth-theme-toggle.component';
import { AUTH_MESSAGES } from '../../constants/messages';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';

@Component({
  imports: [AuthThemeToggle, NgIcon],
  selector: 'sl-auth-layout',
  styleUrl: './auth-layout.scss',
  templateUrl: './auth-layout.html',
  providers: [provideIcons({ lucideCheck })],
})
export class AuthLayout {
  protected readonly messages = AUTH_MESSAGES;
}
