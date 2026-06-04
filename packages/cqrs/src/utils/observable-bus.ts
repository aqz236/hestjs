import { Observable, Subject } from "rxjs";
import { filter } from "rxjs/operators";

export abstract class ObservableBus<T> {
  protected subject$ = new Subject<T>();

  get observable$(): Observable<T> {
    return this.subject$.asObservable();
  }

  /**
   * Returns a filtered stream that only emits events of the specified type.
   */
  ofType<R extends T>(...types: (new (...args: any[]) => R)[]): Observable<R> {
    return this.subject$
      .asObservable()
      .pipe(
        filter((event) => types.some((type) => event instanceof type))
      ) as Observable<R>;
  }

  protected publishToSubject(event: T): void {
    this.subject$.next(event);
  }
}
