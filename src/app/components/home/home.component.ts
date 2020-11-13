import {
  Component,
  OnInit,
  Renderer2,
  ElementRef,
  ViewChild
} from '@angular/core';
import { Select, Store } from '@ngxs/store';

import { AddEventListenerOnce } from '../../services/addEventListenerOnce.service';
import { Inert } from '../../services/inert.service';
import { AppState } from '../../state/app';
import { StateModel } from '../../types';
import { Timers } from '../../services/timers.service';
import { Get } from '../../services/get.service';
import { SetState } from '../../state/actions';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  hideHomeElement: boolean = false;
  disableExploreButton: boolean = false;

  @Select((state: { app: StateModel }) => state.app)
  state$: Observable<StateModel>;

  @ViewChild('Nav', { read: ElementRef }) NavRef: ElementRef<HTMLElement>;
  @ViewChild('View') ViewRef: ElementRef;
  @ViewChild('Home') HomeRef: ElementRef;

  state: StateModel;

  constructor(
    private addEventListenerOnce: AddEventListenerOnce,
    private inert: Inert,
    private renderer: Renderer2,
    private timers: Timers,
    private get: Get,
    private store: Store
  ) {}

  ngOnInit() {
    this.state$.subscribe((state) => (this.state = state));
  }

  async ngAfterViewInit(): Promise<any> {
    const delay = this.timers.delay;
    const Nav = this.NavRef.nativeElement as HTMLElement;

    this.inert.make(Nav, true);

    //load appState from localStorage if present
    if (navigator.cookieEnabled) {
      const weatherAppState: StateModel = JSON.parse(
        localStorage.weatherAppState ?? '{}'
      );

      if (weatherAppState.current) {
        await delay(1000);
        this.hideHomeElement = true;
        this.unmount(); // remove home (splash screen) from the DOM
        await delay(1200);
        this.store
          .dispatch(
            new SetState({
              ...weatherAppState,
              location: {
                ...weatherAppState.location,
                err: false,
                statusText: null
              },
              nightMode: undefined,
              hourliesMounted: false,
              isOnline: navigator.onLine
            })
          )
          .subscribe((state) => (this.state = state.app));
        await delay(2000);

        //update weather data on app load/reload as previous data (from localStorage) might be stale
        if (navigator.onLine) {
          const { current, daily } = await this.get.fetchAndReturnWeatherData(
            this.state.latitude!,
            this.state.longitude!
          );

          if (daily?.length) {
            this.store.dispatch(
              new SetState({
                current,
                daily,
                tomorrow: daily[0],
                other: daily.find(
                  (day) => day.date_string === this.state.other?.date_string
                ),
                lastSynced: Date.now(),
                isOnline: navigator.onLine
              })
            );
          }
        }
      }
    }
  }

  explore(Explore: HTMLButtonElement) {
    const { timers, get } = this;
    const delay = timers.delay;
    // const Explore = this.ExploreRef.nativeElement;

    Explore.disabled = true;
    Explore.textContent = 'Starting...';

    if (!window.Promise) {
      alert(
        "Sorry, your browser can't run this app as it is not supported.\n\nUpgrade to a newer version or a supported one."
      );

      Explore.disabled = false;
      Explore.textContent = 'Explore';
      return;
    }

    const locationRequestSuccess = async (position: Position) => {
      const { latitude, longitude } = position.coords;

      await delay(700);
      this.hideHomeElement = true;
      this.unmount(); // remove home (splash screen) from the DOM
      await delay(1000);
      get.fetchWeatherAndCityDataThenSetState(latitude, longitude, null);
    };

    const locationRequestFailure = async () => {
      await delay(700);
      this.hideHomeElement = true;
      this.unmount(); // remove home (splash screen) from the DOM
      await delay(1000);
      get.fetchWeatherAndCityDataThenSetState(40.69, -73.96);
    };

    const locationRequestOptions = {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000
    };

    navigator.geolocation.getCurrentPosition(
      locationRequestSuccess,
      locationRequestFailure,
      locationRequestOptions
    );
  }

  unmount() {
    const { ViewRef, HomeRef } = this;
    const Nav = this.NavRef.nativeElement as HTMLElement; // using this.NavRef as, for some reason, if accessed by destructuring leads to undefined (bugs)
    const View = ViewRef.nativeElement;
    const Home = HomeRef.nativeElement;

    this.addEventListenerOnce.add(Home, () => {
      this.renderer.removeChild(View, Home);
      Nav.classList.remove('hide');
      this.inert.make(Nav, false);
      document.body.style.overflow = 'unset';
    });
  }
}
