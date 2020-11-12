import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
} from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { StateModel } from '../types';
import { Observable } from 'rxjs';
import { Timers } from '../services/timers.service';
import { Num } from '../services/num.service';
import { MappedImageURL } from '../services/mappedImageUrl.service';
import { AddEventListenerOnce } from '../services/addEventListenerOnce.service';
import { SetState } from '../state/actions';
import { Inert } from '../services/inert.service';
import { Get } from '../services/get.service';
import { Transform } from '../services/transform.service';
import { Task } from '../services/task.service';
import { Query_ } from '../services/query.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent implements OnInit {
  @Select((state: { app: StateModel }) => state.app.other)
  other$: Observable<StateModel['other']>;
  @Select((state: { app: StateModel }) => state.app.latitude)
  latitude$: Observable<number>;
  @Select((state: { app: StateModel }) => state.app.longitude)
  longitude$: Observable<number>;
  @Select((state: { app: StateModel }) => state.app.hourliesMounted)
  hourliesMounted$: Observable<boolean>;
  @Select((state: { app: StateModel }) => state.app.activeTabLinkIndex)
  activeTabLinkIndex$: Observable<number>;

  @ViewChild('TabLinksContainer') TabLinksContainerRef: ElementRef;
  @ViewChild('HourliesToggler') HourliesTogglerRef: ElementRef;
  @ViewChild('HourliesWrapper') HourliesWrapperRef: ElementRef;
  @ViewChild('HourliesList1') HourliesList1Ref: ElementRef;
  @ViewChild('HourliesList2') HourliesList2Ref: ElementRef;
  @ViewChild('Next7DaysSection') Next7DaysSectionRef: ElementRef;

  other: StateModel['other'];
  latitude: number;
  longitude: number;
  hourliesMounted: boolean = false;
  activeTabLinkIndex: number;

  Nav: HTMLElement;
  Main: HTMLElement;
  // SearchWrapper: HTMLElement;
  HourliesToggler: HTMLElement;
  HourliesWrapper: HTMLElement;
  TabLinksContainer: HTMLElement;
  Next7DaysSection: HTMLElement;
  CardMain: HTMLElement;
  SideBarToggler: HTMLElement;

  constructor(
    private store: Store,
    private timers: Timers,
    private addEventListenerOnce: AddEventListenerOnce,
    private inert: Inert,
    private get: Get,
    private transform: Transform,
    private query: Query_,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.other$.subscribe((other) => {
      this.other = other;
      this.cdr.detectChanges();
    });
    this.latitude$.subscribe((latitude) => (this.latitude = latitude));
    this.longitude$.subscribe((longitude) => (this.longitude = longitude));
    this.hourliesMounted$.subscribe((hourliesMounted) => {
      this.hourliesMounted = hourliesMounted;
      this.cdr.detectChanges();
    });
    this.activeTabLinkIndex$.subscribe((index) => {
      this.activeTabLinkIndex = index;
      this.updateTabLinks(index);
    });

    this.Nav = this.query.one('.Nav');
    this.Main = this.query.one('.Main');
    this.HourliesToggler = this.HourliesTogglerRef?.nativeElement;
    this.HourliesWrapper = this.HourliesWrapperRef?.nativeElement;
    this.TabLinksContainer = this.TabLinksContainerRef?.nativeElement;
    this.Next7DaysSection = this.query.one('.daily-list-view');
    this.CardMain = this.query.one('.card .sub-card.type-a');
    this.SideBarToggler = this.query.one('.side-bar-toggler');

    this.inert.make(this.HourliesWrapper, true);

    this.HourliesWrapper.onclick = ({ target }: Event) => {
      if (
        (target as Element).classList.contains('hourlies-wrapper') &&
        this.toggleHourlies
      ) {
        this.toggleHourlies();
      }
    };

    window.onresize = () => {
      if (!this.HourliesWrapper.classList.contains('open')) {
        const refOffset =
          this.CardMain?.offsetTop! + this.CardMain?.offsetHeight!;

        this.transform.displace(
          this.HourliesToggler,
          `translateY(${refOffset - 16}px)`
        );
      }
    };

    window.onresize(window as any);

    window.onpopstate = () => {
      const SearchResultsOverlay = this.query.one('.search-results-overlay');
      const SideBarToggler = this.query.one('.side-bar-toggler');
      const { hash } = window.location;

      const _task = () => {
        if (navigator.onLine) {
          if (hash) {
            const [latitude, longitude] = window.location.hash
              .replace('#', '')
              .split(',')
              .map(parseFloat) ?? [null, null];
            if (!isNaN(latitude) && !isNaN(longitude)) {
              this.get.fetchWeatherAndCityDataThenSetState(
                latitude,
                longitude,
                null
              );
            }
          } else {
            window.history.replaceState(
              {},
              '',
              `${window.location.pathname}#${this.latitude},${this.longitude}`
            );
          }
        }
      };

      Task.assign(_task);
      Task.execute();

      if (SearchResultsOverlay.classList.contains('show')) {
        SearchResultsOverlay.click();
      }

      if (SideBarToggler.classList.contains('is-open')) {
        SideBarToggler.click();
      }
    };

    //update app weather data every 2 minutes
    this.timers.interval(() => {
      this.triggerGetWeatherData();
    }, 900000);

    let getDataTimeout: any = null;
    document.addEventListener('visibilitychange', () => {
      clearTimeout(getDataTimeout);

      if (document.visibilityState === 'visible') {
        getDataTimeout = setTimeout(() => {
          this.triggerGetWeatherData();
        }, 10000);
      }
    });

    this.updateTabLinks(this.activeTabLinkIndex);
  }

  updateTabLinks(activeIndex: number, e?: Event) {
    const TabLinks = this.query.all('.Main .tab-link') as NodeListOf<
      HTMLAnchorElement
    >;
    const TabIndicator = TabLinks[0].previousElementSibling as HTMLSpanElement;

    if (e) {
      e.preventDefault();
    }

    TabLinks?.forEach((TabLink, i) => {
      if (activeIndex === i) {
        this.store.dispatch(new SetState({ activeTabLinkIndex: i }));
        this.timers.delay(10).then(() => {
          const { offsetWidth, offsetLeft } = TabLink;

          TabLink.classList.add('active');
          this.transform.displace(
            TabIndicator,
            `translateX(${offsetLeft - 0.5}px)`
          );
          TabIndicator.style.width = `${offsetWidth + 1}px`;
        });
      } else {
        TabLink.classList.remove('active');
      }
    });
  }

  toggleHourlies() {
    this.hourliesMounted = !this.hourliesMounted;

    this.Main.style.overflow = this.hourliesMounted ? 'hidden' : 'auto';

    this.HourliesWrapper.classList.toggle('open');
    this.HourliesToggler.classList.toggle('toggle-close');

    const isOpen = this.HourliesToggler.classList.contains('toggle-close');

    if (!isOpen) {
      this.store.dispatch(new SetState({ hourliesMounted: false }));
    }

    this.HourliesToggler.textContent = isOpen ? '✕' : 'hourly';
    this.HourliesWrapper.style.overflow = 'hidden';

    this.inert.make(this.Nav, isOpen);
    this.inert.make(this.TabLinksContainer, isOpen);
    this.inert.make(this.HourliesWrapper, !isOpen);
    this.inert.make(this.Next7DaysSection, isOpen);
    this.inert.make(this.SideBarToggler, isOpen);

    this.addEventListenerOnce.add(this.HourliesWrapper, () => {
      this.timers.delay(400).then(() => {
        this.HourliesWrapper.style.overflow = isOpen ? 'auto' : 'hidden';

        if (isOpen) {
          this.store.dispatch(new SetState({ hourliesMounted: true }));
        }
      });
    });
  }

  triggerGetWeatherData() {
    if (navigator.onLine && document.visibilityState === 'visible') {
      this.get
        .fetchAndReturnWeatherData(
          this.latitude as number,
          this.longitude as number
        )
        .then(({ current, daily, hourly }) => {
          this.store.dispatch(
            new SetState({
              current,
              daily,
              tomorrow: daily[0],
              other: daily.find(
                (day) => day.date_string === this.other?.date_string
              ),
              hourly,
              lastSynced: Date.now(),
              isOnline: navigator.onLine
            })
          );
        });
    }
  }
}
