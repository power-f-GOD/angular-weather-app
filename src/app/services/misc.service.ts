import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserAgent {
  deviceIsMobile = /(Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone)/i.test(
    window.navigator.userAgent
  );
  deviceIsMac = /Mac( OS)?/i.test(window.navigator.userAgent);
}
