import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Auth } from '@core/services/auth';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let component: Login;
  let router: Router;

  const authApi = {
    login: vi.fn(),
  };

  beforeEach(async () => {
    authApi.login.mockReset();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: Auth, useValue: authApi }],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders email and password fields with accessible labels', () => {
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('label[for="login-email"]')).toBeTruthy();
    expect(root.querySelector('#login-email')).toBeTruthy();
    expect(root.querySelector('label[for="login-password"]')).toBeTruthy();
    expect(root.querySelector('#login-password')).toBeTruthy();
    expect(root.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it('does not call the API when the form is empty', () => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(authApi.login).not.toHaveBeenCalled();
    expect(component.showErrors()).toBe(true);
  });

  it('logs in and navigates home on success', async () => {
    authApi.login.mockReturnValue(of({ accessToken: 'ok' }));

    component['model'].set({ email: 'alice@example.com', password: 'Password1' });
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(authApi.login).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'Password1',
    });
    expect(router.navigateByUrl).toHaveBeenCalled();
  });

  it('surfaces a server error message on failure', async () => {
    authApi.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } }))
    );

    component['model'].set({ email: 'alice@example.com', password: 'Password1' });
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.serverError()).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('toggles password visibility', () => {
    const password = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;
    expect(password.type).toBe('password');

    component.showPassword.set(true);
    fixture.detectChanges();
    expect(password.type).toBe('text');
  });
});
