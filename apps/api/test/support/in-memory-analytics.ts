import type { AnalyticsProvider, TrackedEvent } from '../../src/shared/analytics/analytics.js';

/** Test provider: records published events; can simulate an outage. */
export class InMemoryAnalyticsProvider implements AnalyticsProvider {
  readonly events: TrackedEvent[] = [];
  failing = false;

  publish(event: TrackedEvent): Promise<void> {
    if (this.failing) return Promise.reject(new Error('simulated analytics outage'));
    this.events.push(event);
    return Promise.resolve();
  }

  names(): string[] {
    return this.events.map((event) => event.event_name);
  }
}
