import { Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { Task } from './services/task.service';
import { SetState } from './state/actions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'angular-weather-app';

  constructor(private store: Store) {};

  ngOnInit() {
    window.ononline = () => {
      Task.execute();
      this.store.dispatch(new SetState({ isOnline: true }));
    };

    window.onoffline = () => {
      this.store.dispatch(new SetState({ isOnline: false }));
    };
  }
}
