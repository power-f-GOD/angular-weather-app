import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Transform {
  displace(el: any, val: string) {
    el.style.WebkitTransform = val;
    el.style.MozTransform = val;
    el.style.OTransform = val;
    el.style.transform = val;
  }
}
