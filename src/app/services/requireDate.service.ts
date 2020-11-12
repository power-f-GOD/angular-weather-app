import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RequireDate {
  chunk(dt?: number, dateFromAPI?: boolean) {
    const dateString = new Date(
      dt ? (dateFromAPI ? Number(`${dt}000`) : dt) : Date.now()
    ).toString();
    const dArr = dateString.split(' ');
    let [day, month, date, hour] = [dArr[0], dArr[1], dArr[2], dArr[4]];
    const date_string = `${month} ${date}`;
    const date_is_today = new RegExp(date_string, 'i').test(
      new Date().toDateString()
    );

    hour = hour.replace(/(.*):\d\d/, '$1');

    return {
      hour,
      day,
      date_is_today,
      date_string,
      date_time: `${hour}, ${month} ${day}`
    };
  }
}
