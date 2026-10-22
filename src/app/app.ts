import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'sl-root',
  template: `<router-outlet />`,
})
export class App { }
