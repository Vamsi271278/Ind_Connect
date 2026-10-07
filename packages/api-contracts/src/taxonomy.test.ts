import { describe, expect, it } from 'vitest';

import { buildOpenApiDocument } from './openapi.js';
import {
  interestCatalogResponseSchema,
  myInterestsResponseSchema,
  updateMyInterestsBodySchema,
  updateMyLanguagesBodySchema,
} from './taxonomy.js';

describe('updateMyLanguagesBodySchema', () => {
  it('accepts one or more distinct ISO codes', () => {
    expect(updateMyLanguagesBodySchema.parse({ languages: ['en', 'te'] })).toEqual({
      languages: ['en', 'te'],
    });
  });

  it('enforces the minimum and rejects duplicates, names and extra fields', () => {
    for (const body of [
      { languages: [] },
      { languages: ['en', 'en'] },
      { languages: ['English'] },
      { languages: ['EN'] },
      { languages: ['en'], proficiency: 'NATIVE' },
      {},
    ]) {
      expect(updateMyLanguagesBodySchema.safeParse(body).success).toBe(false);
    }
  });
});

describe('updateMyInterestsBodySchema', () => {
  const three = ['BADMINTON', 'TELUGU_MOVIES', 'HIKING'];

  it('requires at least three distinct stable codes', () => {
    expect(updateMyInterestsBodySchema.safeParse({ interests: three }).success).toBe(true);
    for (const interests of [
      ['BADMINTON', 'HIKING'],
      ['BADMINTON', 'HIKING', 'HIKING'],
      ['badminton', 'hiking', 'cricket'],
      ['0b5f7f4e-3c1d-4a8e-9f6b-1a2b3c4d5e6f', 'HIKING', 'CRICKET'],
    ]) {
      expect(updateMyInterestsBodySchema.safeParse({ interests }).success).toBe(false);
    }
    expect(
      updateMyInterestsBodySchema.safeParse({ interests: three, custom: 'Chess' }).success,
    ).toBe(false);
  });
});

describe('response contracts', () => {
  it('expose codes and labels only, never internal ids', () => {
    const catalog = {
      categories: [
        { code: 'SPORTS', label: 'Sports', interests: [{ code: 'CRICKET', label: 'Cricket' }] },
      ],
    };
    expect(interestCatalogResponseSchema.safeParse(catalog).success).toBe(true);
    expect(
      interestCatalogResponseSchema.safeParse({
        categories: [{ ...catalog.categories[0], id: '0b5f7f4e-3c1d-4a8e-9f6b-1a2b3c4d5e6f' }],
      }).success,
    ).toBe(false);
    expect(
      myInterestsResponseSchema.safeParse({
        interests: [{ code: 'CRICKET', label: 'Cricket', categoryCode: 'SPORTS', id: 'x' }],
        onboarding: { status: 'IN_PROGRESS', step: 'PHOTO' },
      }).success,
    ).toBe(false);
  });

  it('documents the four endpoints', () => {
    const paths = buildOpenApiDocument().paths as Record<string, Record<string, unknown>>;
    expect(paths['/api/v1/profile/languages']?.get).toBeDefined();
    expect(paths['/api/v1/profile/interests']?.get).toBeDefined();
    expect(paths['/api/v1/users/me/languages']?.put).toBeDefined();
    expect(paths['/api/v1/users/me/interests']?.put).toBeDefined();
  });
});
