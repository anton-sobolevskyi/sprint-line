import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'sl-brand-mark',
  template: `
    <span [class]="markClass()" aria-hidden="true">SL</span>
  `,
})
export class BrandMark {
  /** Visual size: `sm` (auth headers), `md` (sidebar / default), `lg` (auth panel). */
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly markClass = computed(() => {
    const base =
      'bg-primary text-primary-foreground inline-flex shrink-0 items-center justify-center font-bold tracking-wide select-none';
    switch (this.size()) {
      case 'sm':
        return `${base} size-6 rounded-md text-xs`;
      case 'lg':
        return `${base} size-9 rounded-lg text-base`;
      default:
        return `${base} size-7 rounded-lg text-xs`;
    }
  });
}
