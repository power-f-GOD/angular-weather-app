
//used for caching failed tasks (mainly failed network requests) so they can be 'retried/re-executed' e.g. when an API call is made and there's no internet connection, the task is cached/stored then executed when internet connection is regained
export class Task {
  private static task: Function;

  static assign(_task: Function): Task {
    return (this.task = _task), Task;
  }

  static erase(): void {
    this.task = () => {};
  }

  static execute<T>(clear?: boolean): T {
    return clear ? (this.task(), this.erase()) : this.task();
  }
}
