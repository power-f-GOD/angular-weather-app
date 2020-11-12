import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Query_ {
  one(selector: string, host?: HTMLElement | any) {
    if (host) {
      return host.querySelector(selector);
    }

    return document.querySelector(selector);
  }

  all(selector: string, host?: HTMLElement | any) {
    if (host) {
      return host.querySelectorAll(selector);
    }

    return document.querySelectorAll(selector);
  }
}
