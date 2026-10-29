import { Service, signal } from '@angular/core';

@Service()
export class CommandPalette {
  readonly open = signal(false);

  show(): void {
    this.open.set(true);
  }

  hide(): void {
    this.open.set(false);
  }

  toggle(): void {
    this.open.update((value) => !value);
  }
}
