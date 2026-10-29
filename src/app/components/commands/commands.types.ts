export type CommandGroup = 'nav' | 'tasks' | 'projects' | 'actions';

export interface CommandItem {
  id: string;
  group: CommandGroup;
  label: string;
  keywords: string;
  run: () => void;
}
