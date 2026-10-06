import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createIdentityHarness,
  type IdentityHarness,
} from '../../../../test/support/identity-harness.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';
import type { OnboardingStep } from '../../identity/domain/account.js';

const errorCode = async (work: Promise<unknown>) => {
  try {
    await work;
  } catch (error) {
    if (error instanceof ApplicationError) return error.code;
    throw error;
  }
  throw new Error('expected an ApplicationError');
};

describe('LocationService', () => {
  let h: IdentityHarness;
  let userId: string;

  beforeEach(async () => {
    h = createIdentityHarness();
    userId = (await h.signUp('+12145550123', '1995-06-15')).account.id;
  });

  const user = () => {
    const found = h.store.state.users.find((u) => u.id === userId);
    if (found === undefined) throw new Error('no user');
    return found;
  };
  const stepOf = () => user().onboardingStep;
  const setStep = (step: OnboardingStep) => {
    Object.assign(user(), {
      onboardingStep: step,
      onboardingStatus: step === 'COMPLETE' ? 'COMPLETE' : 'IN_PROGRESS',
    });
  };
  const reachLocation = () =>
    h.profileService.updateMyProfile(userId, { firstName: 'Ananya', genderCode: 'WOMAN' });
  const locationSteps = () =>
    h.analyticsProvider.events.filter(
      (e) => e.event_name === 'onboarding_step_completed' && e.properties.step_code === 'LOCATION',
    );

  describe('listSelectableCities', () => {
    it('returns only ACTIVE cities in ACTIVE metros, by name', async () => {
      const cities = await h.locationService.listSelectableCities();
      expect(cities.map((c) => c.name)).toEqual(['Dallas', 'Frisco', 'Plano']);
    });
  });

  describe('updateMyLocation', () => {
    it.each(['NAME', 'GENDER'] as const)(
      'rejects a user at %s and stores nothing (no early collection)',
      async (step) => {
        if (step === 'GENDER') await h.profileService.updateMyProfile(userId, { firstName: 'A' });
        expect(stepOf()).toBe(step);
        expect(
          await errorCode(
            h.locationService.updateMyLocation(userId, h.locations.cityNamed('Frisco').id),
          ),
        ).toBe('ONBOARDING_STEP_NOT_REACHED');
        expect(h.locations.rows.size).toBe(0);
        expect(stepOf()).toBe(step);
      },
    );

    it('at LOCATION: saves the city with server-derived metro/country and advances to INTENT', async () => {
      await reachLocation();
      const frisco = h.locations.cityNamed('Frisco');
      const result = await h.locationService.updateMyLocation(userId, frisco.id);

      expect(result.onboarding).toEqual({ status: 'IN_PROGRESS', step: 'INTENT' });
      expect(result.city.id).toBe(frisco.id);
      expect(stepOf()).toBe('INTENT');
      expect(h.locations.rows.get(userId)).toMatchObject({
        cityId: frisco.id,
        metroId: h.locations.dfw.id,
        countryCode: 'US',
        precisionType: 'MANUAL_CITY',
        source: 'MANUAL',
      });
      expect(locationSteps()).toHaveLength(1);
    });

    it.each(['INTENT', 'LANGUAGE', 'INTERESTS', 'COMPLETE'] as const)(
      'at %s: the city can change and onboarding never rewinds',
      async (step) => {
        setStep(step);
        await h.locationService.updateMyLocation(userId, h.locations.cityNamed('Plano').id);
        const result = await h.locationService.updateMyLocation(
          userId,
          h.locations.cityNamed('Dallas').id,
        );
        expect(result.onboarding.step).toBe(step);
        expect(stepOf()).toBe(step);
        expect(h.locations.rows.get(userId)?.cityId).toBe(h.locations.cityNamed('Dallas').id);
        expect(locationSteps()).toHaveLength(0);
      },
    );

    it('allows an ACTIVE account to edit its city', async () => {
      setStep('COMPLETE');
      h.store.setAccountStatus(userId, 'ACTIVE');
      await expect(
        h.locationService.updateMyLocation(userId, h.locations.cityNamed('Frisco').id),
      ).resolves.toMatchObject({ onboarding: { step: 'COMPLETE' } });
    });

    it.each(['SUSPENDED', 'BANNED', 'DEACTIVATED'] as const)(
      're-checks the account under the row lock: %s fails closed even past the guard',
      async (status) => {
        await reachLocation();
        h.store.setAccountStatus(userId, status);
        expect(
          await errorCode(
            h.locationService.updateMyLocation(userId, h.locations.cityNamed('Frisco').id),
          ),
        ).toBe('ACCOUNT_NOT_ACTIVE');
        expect(h.locations.rows.size).toBe(0);
        expect(stepOf()).toBe('LOCATION');
      },
    );

    it('a second save overwrites the single current row (no history)', async () => {
      await reachLocation();
      await h.locationService.updateMyLocation(userId, h.locations.cityNamed('Frisco').id);
      h.clock.advance(60_000);
      await h.locationService.updateMyLocation(userId, h.locations.cityNamed('Plano').id);
      expect(h.locations.rows.size).toBe(1);
      expect(h.locations.rows.get(userId)).toMatchObject({
        cityId: h.locations.cityNamed('Plano').id,
        capturedAt: h.clock.now(),
      });
      // LOCATION completes once, however many times the city changes.
      expect(locationSteps()).toHaveLength(1);
    });

    it.each(['Mesquite', 'Rockwall', 'Garland', 'Houston'])(
      'rejects %s (WAITLIST / FUTURE / DISABLED city, or a metro that is not ACTIVE)',
      async (name) => {
        await reachLocation();
        expect(
          await errorCode(
            h.locationService.updateMyLocation(userId, h.locations.cityNamed(name).id),
          ),
        ).toBe('CITY_NOT_AVAILABLE');
        expect(h.locations.rows.size).toBe(0);
        expect(stepOf()).toBe('LOCATION');
      },
    );

    it('rejects an unknown city id the same way', async () => {
      await reachLocation();
      expect(
        await errorCode(
          h.locationService.updateMyLocation(userId, '00000000-0000-4000-8000-000000000000'),
        ),
      ).toBe('CITY_NOT_AVAILABLE');
    });

    it('rolls back the location write if the onboarding update fails (one transaction)', async () => {
      await reachLocation();
      vi.spyOn(h.onboarding, 'recordLocationProgress').mockRejectedValueOnce(
        new Error('simulated'),
      );
      await expect(
        h.locationService.updateMyLocation(userId, h.locations.cityNamed('Frisco').id),
      ).rejects.toThrow('simulated');
      expect(h.locations.rows.size).toBe(0);
      expect(stepOf()).toBe('LOCATION');
      expect(locationSteps()).toHaveLength(0);
    });

    it('keeps the city, metro and identifiers out of analytics', async () => {
      await reachLocation();
      const frisco = h.locations.cityNamed('Frisco');
      await h.locationService.updateMyLocation(userId, frisco.id);
      const dump = JSON.stringify(h.analyticsProvider.events);
      for (const secret of ['Frisco', 'DFW', frisco.id, h.locations.dfw.id, userId]) {
        expect(dump).not.toContain(secret);
      }
    });

    it('a failing analytics provider never fails the location update', async () => {
      await reachLocation();
      h.analyticsProvider.failing = true;
      await expect(
        h.locationService.updateMyLocation(userId, h.locations.cityNamed('Frisco').id),
      ).resolves.toMatchObject({ onboarding: { step: 'INTENT' } });
    });
  });
});
