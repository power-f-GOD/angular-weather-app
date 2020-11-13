import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import webpImage from './images/cloudy-sun.webp';

if (environment.production) {
  enableProdMode();
}

const webpSupportChecker = document.querySelector(
  '.webp-support-checker'
) as HTMLImageElement;

const appendToHead = ({ default: styles }) => {
  document.head.insertAdjacentHTML('beforeend', `<style>${styles}</style>`);
};

webpSupportChecker.src = webpImage;
webpSupportChecker.onload = () => {
  import(`./styles/webp.format.scss`).then(appendToHead);
  document.body.classList.add('webp');
};
webpSupportChecker.onerror = () => {
  import(`./styles/png.format.scss`).then(appendToHead);
  document.body.classList.add('no-webp');
};

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
