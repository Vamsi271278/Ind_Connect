import { describe, expect, it } from 'vitest';

import {
  datingConsentResponseSchema,
  intentOptionsResponseSchema,
  putDatingConsentBodySchema,
  updateMyIntentsBodySchema,
} from './intents.js';
import { buildOpenApiDocument } from './openapi.js';

describe('updateMyIntentsBodySchema', () => {
  it('accepts any set of social intents, including none', () => {
    expect(updateMyIntentsBodySchema.parse({ intents: ['FRIENDSHIP', 'NETWORKING'] })).toEqual({
      intents: ['FRIENDSHIP', 'NETWORKING'],
    });
    expect(updateMyIntentsBodySchema.safeParse({ intents: [] }).success).toBe(true);
  });

  it('never accepts DATING, sub-intents, unknown codes or duplicates', () => {
    for (const intents of [
      ['DATING'],
      ['FRIENDSHIP', 'DATING'],
      ['CASUAL_DATING'],
      ['SERIOUS_RELATIONSHIP'],
      ['HOOKUP'],
      ['FRIENDSHIP', 'FRIENDSHIP'],
    ]) {
      expect(updateMyIntentsBodySchema.safeParse({ intents }).success).toBe(false);
    }
  });

  it('rejects extra fields such as a dating flag or consent', () => {
    for (const extra of [{ datingEnabled: true }, { consent: true }, { policyVersion: 'v1' }]) {
      expect(updateMyIntentsBodySchema.safeParse({ intents: [], ...extra }).success).toBe(false);
    }
    expect(updateMyIntentsBodySchema.safeParse({}).success).toBe(false);
  });
});

describe('dating consent contracts', () => {
  it('accepts exactly a well-formed policy version', () => {
    expect(
      putDatingConsentBodySchema.safeParse({ policyVersion: 'dating-draft-2026-10-v0' }).success,
    ).toBe(true);
    for (const body of [
      {},
      { policyVersion: '' },
      { policyVersion: 'has spaces' },
      { policyVersion: 'v1', source: 'SETTINGS' },
      { policyVersion: 'v1', consentedAt: '2026-01-01' },
      { policyVersion: 'v1', accepted: true },
    ]) {
      expect(putDatingConsentBodySchema.safeParse(body).success).toBe(false);
    }
  });

  it('returns only datingEnabled: true, never consent internals', () => {
    expect(datingConsentResponseSchema.safeParse({ datingEnabled: true }).success).toBe(true);
    expect(
      datingConsentResponseSchema.safeParse({ datingEnabled: true, policyVersion: 'v1' }).success,
    ).toBe(false);
  });
});

describe('intentOptionsResponseSchema', () => {
  it('lists top-level options and, only when enabled, the dating policy version', () => {
    const off = {
      options: [{ code: 'FRIENDSHIP', label: 'Friendship', description: 'x' }],
      dating: null,
    };
    expect(intentOptionsResponseSchema.safeParse(off).success).toBe(true);
    expect(
      intentOptionsResponseSchema.safeParse({
        options: [{ code: 'CASUAL_DATING', label: 'Casual dating', description: null }],
        dating: null,
      }).success,
    ).toBe(false);
  });
});

describe('OpenAPI', () => {
  it('documents the intent and dating consent endpoints', () => {
    const paths = buildOpenApiDocument().paths as Record<string, Record<string, unknown>>;
    expect(paths['/api/v1/profile/intents']?.get).toMatchObject({
      operationId: 'listIntentOptions',
    });
    expect(paths['/api/v1/users/me/intents']?.put).toMatchObject({
      operationId: 'updateMyIntents',
    });
    expect(paths['/api/v1/users/me/dating/consent']?.put).toMatchObject({
      operationId: 'putMyDatingConsent',
    });
    expect(paths['/api/v1/users/me/dating/consent']?.delete).toMatchObject({
      operationId: 'deleteMyDatingConsent',
    });
  });
});
