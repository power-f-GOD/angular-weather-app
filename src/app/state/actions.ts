import { StateModel } from '../types';

export class SetState {
  static readonly type = '[App] SetState';
  constructor(public payload: StateModel) {}
}
