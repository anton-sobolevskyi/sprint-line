import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { hideBootLoader } from './app/utils/boot-loader';

bootstrapApplication(App, appConfig).catch((err) => {
  console.error(err);
  hideBootLoader();
});
