/**
 * Auth feature copy. Keys stay stable for future i18n.
 */
export const AUTH_MESSAGES = {
  brand: 'SprintLine',
  login: {
    title: 'Sign in',
    description: 'Enter your email and password to continue.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Your password',
    submit: 'Sign in',
    submitting: 'Signing in…',
    noAccount: 'Don’t have an account?',
    registerLink: 'Create one',
  },
  register: {
    title: 'Create account',
    description: 'Start organizing projects with SprintLine.',
    nameLabel: 'Name',
    namePlaceholder: 'Your name',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 8 characters',
    passwordHint: 'Use at least 8 characters, including a letter and a number.',
    submit: 'Create account',
    submitting: 'Creating account…',
    hasAccount: 'Already have an account?',
    loginLink: 'Sign in',
  },
  validation: {
    emailRequired: 'Email is required.',
    emailInvalid: 'Enter a valid email address.',
    passwordRequired: 'Password is required.',
    passwordMinLength: 'Password must be at least 8 characters.',
    passwordPattern: 'Password must include at least one letter and one number.',
    nameRequired: 'Name is required.',
    nameMinLength: 'Name must be at least 2 characters.',
  },
  home: {
    title: 'Welcome to SprintLine',
    body: 'You are signed in. Project management screens will appear here next.',
    logout: 'Sign out',
    loggingOut: 'Signing out…',
  },
} as const;
