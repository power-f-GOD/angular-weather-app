import { Injectable } from '@angular/core';
import { State, Action, StateContext } from '@ngxs/store';
import { StateModel } from '../types';
import { SetState } from './actions';

@State<StateModel>({
  name: 'app',
  defaults: {
    latitude: 40.69,
    longitude: -73.96,
    location: { name: 'New York, US', err: false },
    nightMode: undefined,
  },
})
@Injectable({ providedIn: 'root' })
export class AppState {
  @Action(SetState)
  SetState(ctx: StateContext<StateModel>, { payload }: SetState) {
    ctx.setState((state) => ({ ...state, ...payload }));
  }
}
