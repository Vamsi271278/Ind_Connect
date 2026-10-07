/** BR-INT-002 top-level intents (DATA-MODEL §17). Sub-intents are not selectable yet. */
export const TOP_LEVEL_INTENT_CODES = ['FRIENDSHIP', 'ACTIVITIES', 'NETWORKING', 'DATING'] as const;
export type TopLevelIntentCode = (typeof TOP_LEVEL_INTENT_CODES)[number];

/** Intents a user sets directly. DATING changes only with dating consent. */
export const SOCIAL_INTENT_CODES = ['FRIENDSHIP', 'ACTIVITIES', 'NETWORKING'] as const;
export type SocialIntentCode = (typeof SOCIAL_INTENT_CODES)[number];

export const DATING_INTENT: TopLevelIntentCode = 'DATING';

export const isTopLevelIntentCode = (value: string): value is TopLevelIntentCode =>
  (TOP_LEVEL_INTENT_CODES as readonly string[]).includes(value);

export interface IntentOption {
  readonly code: TopLevelIntentCode;
  readonly label: string;
  readonly description: string | null;
}

/**
 * O04 choices: DATING is offered only while the Dating kill switch is on
 * (ADR-094); the other options are always offered.
 */
export const offeredIntentOptions = (
  options: readonly IntentOption[],
  datingEnabled: boolean,
): readonly IntentOption[] =>
  options.filter((option) => datingEnabled || option.code !== DATING_INTENT);

/**
 * Social intents to activate and deactivate so that exactly `requested` are
 * active. DATING is never part of either list.
 */
export function socialIntentChanges(
  currentlyActive: readonly TopLevelIntentCode[],
  requested: readonly SocialIntentCode[],
): {
  readonly activate: readonly SocialIntentCode[];
  readonly deactivate: readonly SocialIntentCode[];
} {
  const active = new Set<string>(currentlyActive);
  const wanted = new Set<string>(requested);
  return {
    activate: SOCIAL_INTENT_CODES.filter((code) => wanted.has(code) && !active.has(code)),
    deactivate: SOCIAL_INTENT_CODES.filter((code) => !wanted.has(code) && active.has(code)),
  };
}
