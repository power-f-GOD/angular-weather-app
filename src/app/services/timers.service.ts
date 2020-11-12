import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Timers {
  private static _requestAnimationFrame = Timers._requestAnimationFrameWrapper();

  delay(timeout: number, clearCallback?: Function): Promise<number> {
    return new Promise((resolve: Function) => {
      let start = 0;
      let id = Timers._requestAnimationFrame(animate);
      let clear = clearCallback ? clearCallback : () => false;

      function animate(timestamp: number) {
        if (!start) start = timestamp;
        let timeElapsed = timestamp - start;

        if (timeElapsed < timeout && !clear())
          id = Timers._requestAnimationFrame(animate);
        else resolve(id);
      }
    });
  }

  interval(
    callback: Function,
    _interval: number,
    clearCallback?: Function
  ): Promise<number> {
    return new Promise((resolve: Function) => {
      let start = 0;
      let id = Timers._requestAnimationFrame(animate);
      let clear = false;

      function animate(timestamp: number) {
        if (!start) start = timestamp;

        let timeElapsed = timestamp - start;

        if (!clear) id = Timers._requestAnimationFrame(animate);
        else resolve(id);

        if (timeElapsed % _interval < 17 && timeElapsed > _interval) {
          callback();
          clear = clearCallback ? clearCallback() : false;
        }
      }
    });
  }

  private static _requestAnimationFrameWrapper() {
    let previousTime = 0;

    if (window.requestAnimationFrame) return window.requestAnimationFrame;
    return (callback: Function) => {
      /**
       * Credit to Paul Irish (@ www.paulirish.com) for creating/providing this polyfill
       */
      let timestamp = new Date().getTime();
      let timeout = Math.max(0, 16 - (timestamp - previousTime));
      let id = setTimeout(() => {
        callback(timestamp + timeout);
      }, 16); //corrected this line from 'timeout' in actual polyfill to '16' as it made animation slow and jank

      previousTime = timestamp + timeout;

      return id;
    };
  }
}
