import { Injectable } from '@angular/core';

//adds event listener once in order for to prevent multiple additions (in some cases) and avoid bugs
@Injectable({ providedIn: 'root' })
export class AddEventListenerOnce {
  add(
    target: HTMLElement | any,
    callback: Function | any,
    event?: string,
    options?: { capture?: boolean; once?: boolean; passive?: boolean }
  ) {
    event = event ? event : 'transitionend';

    try {
      target.addEventListener(
        event,
        callback,
        options
          ? {
              ...(options ?? {}),
              once: options.once !== undefined ? options.once : true,
            }
          : { once: true }
      );
    } catch (err) {
      target.removeEventListener(
        event,
        callback,
        options?.capture ? true : false
      );
      target.addEventListener(event, callback, options?.capture ? true : false);
    }
  }
}
