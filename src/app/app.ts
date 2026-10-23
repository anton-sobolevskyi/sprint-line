import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HlmToasterImports } from '@spartan-ng/helm/sonner';

@Component({
  imports: [RouterOutlet, ...HlmToasterImports],
  selector: 'sl-root',
  template: `
    <router-outlet />
    <hlm-toaster position="bottom-right" />
  `,
})
export class App {}
