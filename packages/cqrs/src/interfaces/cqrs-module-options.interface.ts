export interface CqrsModuleOptions {
  commandPublisher?: any;
  eventPublisher?: any;
  queryPublisher?: any;
}

export interface CqrsModuleAsyncOptions {
  useValue?: CqrsModuleOptions;
  useFactory?: (
    ...args: any[]
  ) => Promise<CqrsModuleOptions> | CqrsModuleOptions;
  useClass?: new (...args: any[]) => CqrsModuleOptionsFactory;
  useExisting?: any;
  inject?: any[];
  imports?: any[];
}

export interface CqrsModuleOptionsFactory {
  createCqrsOptions(): Promise<CqrsModuleOptions> | CqrsModuleOptions;
}
