import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';

import {
  WeatherInfoProps,
  CitiesResponse,
  WeatherResponseProps
} from '../types';
import { SetState } from '../state/actions';
import { Task } from './task.service';
import { RequireDate } from './requireDate.service';

@Injectable({ providedIn: 'root' })
export class Get {
  state = this.store.selectSnapshot((state) => state).app;

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient,
    private store: Store,
    private requireDate: RequireDate
  ) {}

  init<T>(baseUrl: string, query: string): Promise<T> {
    return this.http.get<T>(`${baseUrl}?${query}`).toPromise();
  }

  // return weather data
  async fetchAndReturnWeatherData(
    latitude: number,
    longitude: number
  ): Promise<Partial<WeatherResponseProps>> {
    const { current, daily: _daily, hourly } =
      (await this.init<WeatherResponseProps>(
        'https://api.openweathermap.org/data/2.5/onecall',
        `lat=${latitude}&lon=${longitude}&exclude=minutely&units=metric&appid=cb63632ad608cb4a62e629457f522c6e`
      )) ?? {};

    const daily = _daily?.slice(1).map((day) => {
      const dataset = {
        feels_like: 0,
        wind_speed: 0,
        temp: 0,
        main: undefined,
        description: '',
        date_string: '',
        dt: 0,
        humidity: 0,
        uvi: 0
      } as WeatherInfoProps & { [key: string]: any };

      let _value: any = 0;

      for (const key in dataset) {
        const datum = (dataset[key] = (day as any)[key]);

        if (/feels_like|temp/.test(key) && datum) {
          const data = dataset[key];
          let value: string | number = 0;
          let length = 0;

          for (const val in data) {
            if (datum === 'temp' && /min|max/.test(val)) {
              continue;
            }

            value += Number(data[val as any]);
            length += 1;
          }

          value /= length;
          _value = value;
        } else {
          let value = datum;

          switch (true) {
            case /description|main/.test(key):
              const { description, main } = day.weather?.slice(-1)[0] ?? {};

              value = key === 'main' ? main : description;
              break;
            case key === 'date_string':
              value = this.requireDate.chunk(day.dt, true).date_string;
              break;
          }

          _value = value;
        }

        dataset[key] = _value;
      }

      return dataset;
    });

    return Promise.resolve({ current, daily, hourly });
  }

  // return weather and city data then setState
  fetchWeatherAndCityDataThenSetState(
    latitude: number,
    longitude: number,
    location?: string | null
  ): Promise<void> {
    let _task = async () => {
      this.store
        .dispatch(
          new SetState({
            latitude,
            longitude,
            location: { statusText: 'Fetching weather data...', err: false }
          })
        )
        .subscribe((observer) => (this.state = observer.app));

      try {
        const { current, daily, hourly } =
          (await this.fetchAndReturnWeatherData(latitude, longitude)) ?? {};

        if (current || daily) {
          this.store
            .dispatch(
              new SetState({
                current,
                tomorrow: daily[0],
                other: daily[1],
                daily,
                hourly,
                activeTabLinkIndex: this.state.activeTabLinkIndex || 0,
                lastSynced: Date.now(),
                location: {
                  name:
                    location === undefined
                      ? 'New York, US'
                      : location
                      ? location
                      : this.state.location?.name,
                  statusText:
                    location === null ? 'Getting location name...' : null,
                  err: false
                },
                isOnline: navigator.onLine
              })
            )
            .subscribe((observer) => {
              this.state = observer.app;
            });
        }

        if (location === null) {
          _task = async () => {
            this.store
              .dispatch(
                new SetState({
                  location: {
                    statusText: 'Getting location name...',
                    err: false
                  }
                })
              )
              .subscribe((observer) => (this.state = observer.app));

            const { city, prov } = ((await this.init<CitiesResponse>(
              'https://geocode.xyz/',
              `locate=${latitude},${longitude}&geoit=json`
            ).catch(this.catch.bind(this))) ?? {}) as CitiesResponse;

            this.store
              .dispatch(
                new SetState({
                  location: {
                    name: city ? `${city}, ${prov}` : this.state.location?.name,
                    err: !city,
                    statusText: !city
                      ? 'Error getting location name. Tap here to retry.'
                      : null
                  }
                })
              )
              .subscribe((observer) => (this.state = observer.app));

            if (city) {
              Task.erase();
            }
          };

          Task.assign(_task);
          Task.execute();
        } else if (daily.length) {
          Task.erase();
        }
      } catch (e) {
        this.catch.bind(this)(e);
      }
    };

    return Task.assign(_task), Task.execute<Promise<void>>();
  }

  catch(e?: any) {
    const err = String(e);

    if (/fetch|network|promise/i.test(err)) {
      alert(
        `${
          !navigator.onLine
            ? "Couldn't fetch data. You're offline."
            : "A network error occurred. Sure you're connected?"
        } `
      );
    }

    this.store
      .dispatch(
        new SetState({
          location: {
            statusText: '⚠ An error occurred. Tap here to retry.',
            err: true
          },
          isOnline: navigator.onLine
        })
      )
      .subscribe((observer) => (this.state = observer.app));

    console.error('E042:', e);
  }
}
