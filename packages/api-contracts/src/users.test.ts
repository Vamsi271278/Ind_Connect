import { describe, expect, it } from 'vitest';

import { buildOpenApiDocument } from './openapi.js';
import { bootstrapResponseSchema, selfUserSchema, updateProfileBodySchema } from './users.js';

describe('updateProfileBodySchema', () => {
  it('accepts name and gender updates, alone or together', () => {
    expect(updateProfileBodySchema.parse({ firstName: '  Ananya ' })).toEqual({
      firstName: 'Ananya',
    });
    expect(updateProfileBodySchema.safeParse({ genderCode: 'PREFER_NOT_TO_SAY' }).success).toBe(
      true,
    );
    expect(
      updateProfileBodySchema.safeParse({
        genderCode: 'SELF_DESCRIBE',
        genderSelfDescription: 'Genderfluid',
      }).success,
    ).toBe(true);
  });

  it('rejects empty bodies, unknown/protected fields and lastName (deferred)', () => {
    expect(updateProfileBodySchema.safeParse({}).success).toBe(false);
    for (const extra of [
      { accountStatus: 'ACTIVE' },
      { lastName: 'Rao' },
      { dateOfBirth: '1990-01-01' },
      { id: 'x' },
    ]) {
      expect(updateProfileBodySchema.safeParse({ firstName: 'Ananya', ...extra }).success).toBe(
        false,
      );
    }
  });

  it('rejects a self-description paired with another gender code', () => {
    expect(
      updateProfileBodySchema.safeParse({ genderCode: 'MAN', genderSelfDescription: 'x' }).success,
    ).toBe(false);
    expect(updateProfileBodySchema.safeParse({ genderCode: 'ROBOT' }).success).toBe(false);
  });
});

describe('selfUserSchema', () => {
  const valid = {
    id: '0b5f7f4e-3c1d-4a8e-9f6b-1a2b3c4d5e6f',
    accountStatus: 'PENDING_VERIFICATION',
    onboarding: { status: 'IN_PROGRESS', step: 'NAME' },
    profile: { firstName: null, genderCode: null, genderSelfDescription: null },
    phoneMasked: '+1 ••• ••• 0123',
    age: 31,
  };

  it('accepts the self projection and refuses any extra private field', () => {
    expect(selfUserSchema.safeParse(valid).success).toBe(true);
    for (const leak of [
      { dateOfBirth: '1990-01-01' },
      { phoneE164: '+12145550123' },
      { tokenFamilyId: 'x' },
      { createdAt: 'x' },
    ]) {
      expect(selfUserSchema.safeParse({ ...valid, ...leak }).success).toBe(false);
    }
  });
});

describe('bootstrapResponseSchema', () => {
  it('allows a null or populated account and nothing else', () => {
    const base = {
      maintenanceMode: false,
      minimumSupportedVersion: '1.0.0',
      featureFlags: {},
      account: null,
    };
    expect(bootstrapResponseSchema.safeParse(base).success).toBe(true);
    expect(
      bootstrapResponseSchema.safeParse({
        ...base,
        account: { status: 'ACTIVE', onboardingStatus: 'COMPLETE', onboardingStep: 'COMPLETE' },
      }).success,
    ).toBe(true);
    expect(bootstrapResponseSchema.safeParse({ ...base, entitlement: 'premium' }).success).toBe(
      false,
    );
  });
});

describe('OpenAPI document', () => {
  const document = buildOpenApiDocument();
  const text = JSON.stringify(document);

  it('is an OpenAPI 3.1 document with paths, components and security schemes', () => {
    expect(document.openapi).toBe('3.1.0');
    expect(Object.keys(document.paths as object)).toEqual(
      expect.arrayContaining([
        '/api/v1/auth/otp/verify',
        '/api/v1/users/me',
        '/api/v1/users/me/profile',
        '/api/v1/app/bootstrap',
      ]),
    );
    expect(text).toContain('"bearerAuth"');
    expect(text).toContain('"Idempotency-Key"');
  });

  it('has no dangling component references', () => {
    const components = document.components as Record<string, Record<string, unknown>>;
    const refs = [...new Set(text.match(/#\/components\/[A-Za-z]+\/[A-Za-z0-9]+/g) ?? [])];
    const dangling = refs.filter((reference) => {
      const [, , kind = '', name = ''] = reference.split('/');
      return components[kind]?.[name] === undefined;
    });
    expect(dangling).toEqual([]);
  });

  it('never documents private fields in the self projection', () => {
    const selfUser = JSON.stringify(
      (document.components as Record<string, Record<string, unknown>>).schemas?.SelfUser,
    );
    for (const field of ['dateOfBirth', 'phoneE164', 'lastName'])
      expect(selfUser).not.toContain(field);
  });
});
