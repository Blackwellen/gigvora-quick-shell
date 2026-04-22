import { Provider } from '@nestjs/common';
import { getDb, type Db } from '@gigvora/db';

export const DB = Symbol('GIGVORA_DB');

/** Inject with `@Inject(DB) private readonly db: Db`. */
export const DbProvider: Provider = {
  provide: DB,
  useFactory: (): Db => getDb(),
};
