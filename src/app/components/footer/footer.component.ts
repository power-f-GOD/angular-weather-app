import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';

import { Inert } from '../../services/inert.service';
import { Query_ } from '../../services/query.service';
import { SetState } from '../../state/actions';
import { StateModel } from '../../types';
import { RequireDate } from '../../services/requireDate.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnInit {
  @Select((state: { app: StateModel }) => state.app.nightMode)
  nightMode$: Observable<boolean>;
  @Select((state: { app: StateModel }) => state.app.lastSynced)
  lastSynced$: Observable<number>;
  @Select((state: { app: StateModel }) => state.app.isOnline)
  isOnline$: Observable<boolean>;

  @ViewChild('SideBarContainer') SideBarContainerRef: ElementRef;
  @ViewChild('SideBar') SideBarRef: ElementRef;
  @ViewChild('SideBarToggler') SideBarTogglerRef: ElementRef;
  @ViewChild('HourliesToggler') HourliesTogglerRef: ElementRef;
  @ViewChild('HourliesWrapper') HourliesWrapperRef: ElementRef;
  @ViewChild('HourliesList1') HourliesList1Ref: ElementRef;
  @ViewChild('HourliesList2') HourliesList2Ref: ElementRef;
  @ViewChild('Next7DaysSection') Next7DaysSectionRef: ElementRef;

  Nav: HTMLElement;
  Main: HTMLElement;
  SideBarContainer: HTMLElement;
  SideBar: HTMLElement;
  SideBarToggler: HTMLElement;
  ThemeToggler: HTMLElement;
  Install: HTMLElement;

  nightMode: boolean;
  lastSynced: string;
  isOnline: boolean;

  deferredPromptForInstall: any;

  constructor(
    private store: Store,
    private inert: Inert,
    private query: Query_,
    private requireDate: RequireDate,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.nightMode$.subscribe((nightMode) => {
      this.nightMode = nightMode;
    });
    this.lastSynced$.subscribe((lastSynced) => {
      const { date_string, hour, day, date_is_today } = this.requireDate.chunk(
        lastSynced
      );

      this.lastSynced = lastSynced
        ? `${date_is_today ? 'today' : `${day}, ${date_string}`} at ${hour}`
        : '...';
      this.cdr.detectChanges();
    });
    this.isOnline$.subscribe((isOnline) => {
      this.isOnline = isOnline;
      this.cdr.detectChanges();
    });

    this.Nav = this.query.one('.Nav');
    this.Main = this.query.one('.Main');
    this.SideBarContainer = this.query.one('.Footer .container');
    this.SideBar = this.query.one('.side-bar');
    this.SideBarToggler = this.SideBarTogglerRef?.nativeElement;
    this.ThemeToggler = this.SideBarContainer.querySelector(
      '.theme-toggler'
    ) as HTMLElement;
    this.Install = this.SideBarContainer.querySelector(
      '.install'
    ) as HTMLElement;

    this.inert.make(this.SideBarContainer, true);

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPromptForInstall = e;
    });

    window.addEventListener('appinstalled', () => {
      this.inert.make(this.Install, true);
      this.Install.textContent = 'Installed';
    });

    this.SideBar.onclick = ({ target }: Event) => {
      if (/^A$/i.test((target as Element).tagName)) {
        this.toggleSideBar();
      }
    };

    this.SideBarContainer.addEventListener('click', ({ target }: Event) => {
      if (target === this.SideBarContainer) {
        this.toggleSideBar();
      }
    });

    let displayMode = 'browser tab';
    if (
      (navigator as any).standalone ||
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      displayMode = 'standalone(-ios)';
    }

    if (/standalone/.test(displayMode)) {
      this.Install.style.display = 'none';
    }

    this.store.dispatch(
      new SetState({
        isOnline: navigator.onLine
      })
    );
  }

  toggleSideBar() {
    this.SideBarToggler.classList.toggle('is-open');

    const isOpen = this.SideBarToggler.classList.contains('is-open');

    this.inert.make(this.SideBarContainer, !isOpen);
    this.inert.make(this.Nav, isOpen);
    this.inert.make(this.Main, isOpen);
    this.inert.make(this.Install, true);
    this.SideBar.classList[isOpen ? 'add' : 'remove']('open');
    this.SideBarContainer.classList[isOpen ? 'add' : 'remove']('show');

    document.body.style.overflow = isOpen ? 'hidden' : 'auto';

    if (this.deferredPromptForInstall) {
      this.inert.make(this.Install, false);

      this.Install.addEventListener('click', () => {
        this.deferredPromptForInstall.prompt();
        this.deferredPromptForInstall.userChoice.then(
          (choiceResult: { outcome: string }) => {
            if (choiceResult.outcome == 'accepted') {
              this.inert.make(this.Install, true);
            }

            this.deferredPromptForInstall = null;
          }
        );
      });
    } else {
      this.Install.style.display = 'none';
    }
  }

  toggleTheme() {
    this.store.dispatch(
      new SetState({
        nightMode: this.nightMode !== undefined ? !this.nightMode : true
      })
    );
    this.cdr.detectChanges();
  }
}
