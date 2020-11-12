import { Injectable } from '@angular/core';
import { WeatherResponseMain, WeatherImageClassName } from '../types';

@Injectable({ providedIn: 'root' })
export class MappedImageURL {
  require(main: WeatherResponseMain, desc: string): WeatherImageClassName {
    switch (true) {
      case /clear/i.test(main):
        return 'sunny';
      case /thunderstorm/i.test(main):
        return /rain/i.test(desc) ? 'thunder-storm' : 'thunder-cloud';
      case /drizzle|rainy?/i.test(main):
        return /heavy/i.test(desc) ? 'rainy-cloud' : 'clouds-sun-rain';
      case /snow/i.test(main):
        return 'snowy-cloud';
      case /tornado/i.test(main):
        return 'cloud-storm';
      case /clouds/i.test(main):
        return /few/i.test(desc) ? 'cloudy-sun' : 'cloudy';
      default:
        return 'atmosphere';
    }
  }
}
