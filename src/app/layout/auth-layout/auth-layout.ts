import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { ThemeToggle } from '../../components/theme-toggle/theme-toggle';
import { AUTH_MESSAGES } from '@constants/messages';

@Component({
  imports: [ThemeToggle, NgIcon],
  selector: 'sl-auth-layout',
  styleUrl: './auth-layout.scss',
  templateUrl: './auth-layout.html',
  providers: [provideIcons({ lucideCheck })],
})
export class AuthLayout {
  protected readonly messages = AUTH_MESSAGES;
}
