export const DASHBOARD_MESSAGES = {
  greeting: 'Welcome back',
  greetingNamed: 'Welcome back, {name}',
  subtitle: 'Your workspace overview.',
  stats: {
    projects: 'Projects',
    membersHint: 'Across your workspace',
  },
  recent: {
    title: 'Recent projects',
    emptyTitle: 'No projects yet',
    emptyBody: 'Create a project to start planning tasks with your team.',
    emptyAction: 'Create project',
    open: 'Open',
    viewAll: 'View all projects',
    members: 'members',
  },
  quick: {
    title: 'Quick actions',
    projects: 'Browse projects',
    newProject: 'New project',
    profile: 'Account settings',
  },
  loading: 'Loading dashboard…',
  retry: 'Try again',
} as const;
