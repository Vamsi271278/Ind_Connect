import { eq } from 'drizzle-orm';

import type { Database, DbExecutor } from '../../../shared/database/database.module.js';
import { executorOf } from '../../../shared/database/drizzle-unit-of-work.js';
import { cities, metros, userLocations } from '../../../shared/database/schema/index.js';
import type { TransactionContext } from '../../../shared/database/unit-of-work.js';
import {
  type City,
  isLaunchStatus,
  type LaunchStatus,
  type ManualCityLocation,
} from '../domain/location.js';
import type { LocationRepository, LocationStore } from '../application/ports.js';

const toLaunchStatus = (value: string): LaunchStatus => {
  if (!isLaunchStatus(value)) throw new Error('launch_status outside known values');
  return value;
};

const cityColumns = {
  id: cities.id,
  name: cities.name,
  stateRegion: cities.stateRegion,
  countryCode: cities.countryCode,
  launchStatus: cities.launchStatus,
  metroId: metros.id,
  metroCode: metros.code,
  metroName: metros.name,
  metroCountryCode: metros.countryCode,
  metroLaunchStatus: metros.launchStatus,
};

type CityRow = {
  [K in keyof typeof cityColumns]: (typeof cityColumns)[K]['_']['data'];
};

const toCity = (row: CityRow): City => ({
  id: row.id,
  name: row.name,
  stateRegion: row.stateRegion,
  countryCode: row.countryCode,
  launchStatus: toLaunchStatus(row.launchStatus),
  metro: {
    id: row.metroId,
    code: row.metroCode,
    name: row.metroName,
    countryCode: row.metroCountryCode,
    launchStatus: toLaunchStatus(row.metroLaunchStatus),
  },
});

class DrizzleLocationRepository implements LocationRepository {
  constructor(private readonly db: DbExecutor) {}

  async listCities(): Promise<readonly City[]> {
    const rows = await this.db
      .select(cityColumns)
      .from(cities)
      .innerJoin(metros, eq(metros.id, cities.metroId));
    return rows.map(toCity);
  }

  async findCityForShare(cityId: string): Promise<City | undefined> {
    const [row] = await this.db
      .select(cityColumns)
      .from(cities)
      .innerJoin(metros, eq(metros.id, cities.metroId))
      .where(eq(cities.id, cityId))
      .for('share')
      .limit(1);
    return row === undefined ? undefined : toCity(row);
  }

  async upsertUserLocation(userId: string, location: ManualCityLocation, at: Date): Promise<void> {
    await this.db
      .insert(userLocations)
      .values({ userId, ...location, capturedAt: at, updatedAt: at })
      .onConflictDoUpdate({
        target: userLocations.userId,
        set: { ...location, capturedAt: at, updatedAt: at },
      });
  }
}

export class DrizzleLocationStore implements LocationStore {
  readonly repository: LocationRepository;

  constructor(db: Database) {
    this.repository = new DrizzleLocationRepository(db);
  }

  forTransaction(tx: TransactionContext): LocationRepository {
    return new DrizzleLocationRepository(executorOf(tx));
  }
}
