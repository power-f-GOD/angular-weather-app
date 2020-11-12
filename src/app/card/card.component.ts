import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { StateModel, WeatherResponseMain, WeatherInfoProps } from '../types';
import { Timers } from '../services/timers.service';
import { Num } from '../services/num.service';
import { MappedImageURL } from '../services/mappedImageUrl.service';
import { AddEventListenerOnce } from '../services/addEventListenerOnce.service';
import { SetState } from '../state/actions';
import { Query_ } from '../services/query.service';

interface CardPropsModel {
  feels_like: number;
  uvi: string;
  wind_speed: number;
  temperature: number;
  thermometer_min_height: number;
  desc: string;
  humidity: number;
  className: string;
  display_uvi: boolean;
  uvi_className: string;
  thermometer_className: string;
  date_string?: string;
  clickEventListener?: any;
}

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent implements OnInit {
  @Select((state: { app: StateModel }) => state.app.current)
  current$: Observable<StateModel['current']>;
  @Select((state: { app: StateModel }) => state.app.tomorrow)
  tomorrow$: Observable<StateModel['tomorrow']>;
  @Select((state: { app: StateModel }) => state.app.other) other$: Observable<
    StateModel['other']
  >;
  @Select((state: { app: StateModel }) => state.app.daily) daily$: Observable<
    StateModel['daily']
  >;
  @Select((state: { app: StateModel }) => state.app.hourly) hourly$: Observable<
    StateModel['hourly']
  >;
  @Select((state: { app: StateModel }) => state.app.activeTabLinkIndex)
  activeTabLinkIndex$: Observable<number>;
  @Select((state: { app: StateModel }) => state.app.nightMode)
  nightMode$: Observable<boolean>;
  @Select((state: { app: StateModel }) => state.app.hourliesMounted)
  hourliesMounted$: Observable<boolean>;

  @ViewChild('CardMain', { read: ElementRef }) CardMainRef: ElementRef;

  @Input() type: 'A' | 'B' | 'C';
  @Input() slice: '1' | '2';

  current: StateModel['current'];
  tomorrow: StateModel['tomorrow'];
  other: StateModel['other'];
  daily: StateModel['daily'];
  hourly: StateModel['hourly'];
  activeTabLinkIndex: number = 0;
  nightMode: boolean;
  hourliesMounted: boolean;

  CardMainProps: CardPropsModel;
  CardsDailyProps = Array(7).fill(null) as Partial<CardPropsModel>[];
  CardsHourlyProps = null;

  constructor(
    private store: Store,
    private timers: Timers,
    private num: Num,
    private mappedImageURL: MappedImageURL,
    private addEventListenerOnce: AddEventListenerOnce,
    private cdr: ChangeDetectorRef,
    private query: Query_
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.activeTabLinkIndex$.subscribe((index) => {
      this.activeTabLinkIndex = index;

      const data =
        index === 0 ? this.current : index === 1 ? this.tomorrow : this.other;

      this.update(data as any, 'A');
    });
    this.current$.subscribe((current) => {
      this.current = current;

      if (this.activeTabLinkIndex === 0) {
        this.update(current as any, 'A');
      }
    });
    this.tomorrow$.subscribe((tomorrow) => {
      this.tomorrow = tomorrow;

      if (this.activeTabLinkIndex === 1) {
        this.update(tomorrow as any, 'A');
      }
    });
    this.other$.subscribe((other) => {
      this.other = other;

      if (this.activeTabLinkIndex === 2) {
        this.update(other as any, 'A');
      }
    });

    this.daily$.subscribe((daily) => {
      this.daily = daily;
      this.update(daily as any, 'B');
    });
    this.hourly$.subscribe((hourly) => {
      this.hourly = hourly;
      this.update(hourly as any, 'C');
    });
    this.nightMode$.subscribe((nightMode) => {
      this.nightMode = nightMode;
      this.updateBody({ nightMode });
    });
  }

  async update(
    data: Partial<WeatherInfoProps & WeatherInfoProps[]> | null,
    type: 'A' | 'B' | 'C'
  ) {
    switch (type) {
      case 'A':
        {
          const { temp, weather, humidity, feels_like, wind_speed, uvi } =
            data || ({} as WeatherInfoProps);
          const { description, main } = weather?.slice(-1)[0] ?? data ?? {};

          const weatherImage = this.mappedImageURL.require(
            main as WeatherResponseMain,
            description as string
          );

          const Body = document.body;
          const Card = this.CardMainRef?.nativeElement;

          if (!Card) return;

          if (Body.classList.contains('animate-card-overlay')) {
            await this.timers.delay(400);
            Body.classList.remove('animate-card-overlay');
          }

          const currentHr = new Date(Date.now()).getHours();
          const isNightTime = currentHr >= 19 || currentHr < 7;
          const celsiusVal = this.num.round(temp as number);
          const uviVal = this.num.round(+uvi!);
          const uviSafety =
            uviVal < 3 ? 'safe' : uviVal < 8 ? 'moderate' : 'not-safe';
          const feel =
            celsiusVal < 20 ? 'cold' : celsiusVal < 40 ? 'warm' : 'hot';

          if (!isNaN(celsiusVal)) {
            this.addEventListenerOnce.add(
              Card,
              () => Body.classList.remove('animate-card-overlay'),
              'animationend'
            );
            await this.timers.delay(20);
            Body.classList.add('animate-card-overlay');
            await this.timers.delay(350);

            this.CardMainProps = {
              feels_like: this.num.round(+feels_like!),
              uvi: String(uviVal),
              wind_speed: this.num.round(wind_speed),
              temperature: celsiusVal,
              thermometer_min_height: celsiusVal,
              desc: (description![0].toUpperCase() +
                description!.slice(1)) as string,
              humidity: this.num.round(humidity),
              className: `condition--${weatherImage}--0 animate`,
              display_uvi: !isNightTime,
              uvi_className: `i--${uviSafety}--0`,
              thermometer_className: `therm--${feel}--0`
            };

            if (isNightTime) {
              this.store.dispatch(
                new SetState({
                  nightMode:
                    this.nightMode === undefined ? isNightTime : this.nightMode
                })
              );
            }

            this.updateBody({ nightMode: this.nightMode, weatherMain: main });
          }
        }
        break;
      case 'B': {
        this.CardsDailyProps =
          data?.map((datum, index) => {
            const { date_string, temp, weather } = datum;
            const { description, main } = weather?.slice(-1)[0] ?? datum ?? {};

            const weatherImage = this.mappedImageURL.require(
              main as WeatherResponseMain,
              description as string
            );

            return {
              date_string,
              temperature: this.num.round(temp as number),
              className: `condition--${weatherImage}--0 animate`,
              clickEventListener: (e: Event) => {
                e.preventDefault();
                const { daily, tomorrow } = this.store.selectSnapshot(
                  (state) => state.app
                );

                if (index! > 0) {
                  this.store.dispatch(
                    new SetState({
                      other: { ...daily![index as number] },
                      activeTabLinkIndex: 2
                    })
                  );
                } else {
                  this.store.dispatch(
                    new SetState({
                      activeTabLinkIndex: 1,
                      tomorrow: { ...tomorrow! }
                    })
                  );
                }
              }
            };
          }) || this.CardsDailyProps;

        break;
      }
    }

    this.cdr.detectChanges();
  }

  updateBody(props: {
    nightMode?: boolean;
    weatherMain?: WeatherResponseMain;
  }) {
    const Body = document.body;
    const MetaTheme = this.query.one("meta[name='theme-color']");

    const { nightMode, weatherMain } = props;
    const delayTimeout =
      nightMode !== undefined
        ? 50
        : Body.classList.contains('animate-card-overlay')
        ? 750
        : weatherMain
        ? 350
        : 100;

    this.timers.delay(delayTimeout).then(() => {
      let metaColor = 'rgb(25, 166, 230)';

      if (weatherMain) {
        let className: 'primary' | 'secondary' | 'tertiary' = 'primary';

        switch (true) {
          case /clouds|drizzle|rainy?|snow/i.test(
            weatherMain as WeatherResponseMain
          ):
            className = 'primary';
            break;
          case /clear/i.test(weatherMain as WeatherResponseMain):
            className = 'secondary';
            metaColor = 'rgb(179, 163, 25)';
            break;
          default:
            className = 'tertiary';
            metaColor = 'rgb(128, 128, 128)';
        }

        Body.className = Body.className.replace(
          /(theme--).*(--0)/,
          `$1${className}$2`
        );
      }

      if (nightMode !== undefined) {
        Body.classList[nightMode ? 'add' : 'remove']('night-time');
      }

      MetaTheme.content = this.nightMode ? 'rgb(0, 85, 149)' : metaColor;
    });
  }
}
