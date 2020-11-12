import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Num {
  round(num?: number) {
    return Number(Number(num)?.toFixed(1));
  }
}
