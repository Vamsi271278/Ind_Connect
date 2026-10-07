import type {
  IntentOption,
  SocialIntentCode,
  TopLevelIntentCode,
} from '@project-connect/api-contracts';

export const isSocialIntent = (code: TopLevelIntentCode): code is SocialIntentCode =>
  code !== 'DATING';

export interface IntentRow {
  readonly code: TopLevelIntentCode;
  readonly label: string;
  readonly description: string | null;
  readonly checked: boolean;
}

/**
 * O04 rows. Social rows reflect the user's edits (or the saved state).
 * The Dating row reflects only the server's `datingEnabled`: it is offered
 * while the kill switch is on, and kept visible while Dating is on so the user
 * can always turn it off, even if the switch has since been turned off.
 */
export function intentRows(input: {
  readonly options: readonly IntentOption[];
  readonly socialSelection: ReadonlySet<SocialIntentCode>;
  readonly datingEnabled: boolean;
}): readonly IntentRow[] {
  const rows: IntentRow[] = input.options.map((option) => ({
    code: option.code,
    label: option.label,
    description: option.description,
    checked: isSocialIntent(option.code)
      ? input.socialSelection.has(option.code)
      : input.datingEnabled,
  }));
  if (input.datingEnabled && !rows.some((row) => row.code === 'DATING')) {
    rows.push({ code: 'DATING', label: 'Dating', description: null, checked: true });
  }
  return rows;
}

/** Saved social intents, as the initial selection. */
export const savedSocialSelection = (
  activeIntents: readonly TopLevelIntentCode[],
): ReadonlySet<SocialIntentCode> => new Set(activeIntents.filter(isSocialIntent));

/** BR-INT-001: at least one intent, counting an active Dating. */
export const canContinue = (
  socialSelection: ReadonlySet<SocialIntentCode>,
  datingEnabled: boolean,
): boolean => socialSelection.size > 0 || datingEnabled;

export function toggleSocial(
  selection: ReadonlySet<SocialIntentCode>,
  code: SocialIntentCode,
): ReadonlySet<SocialIntentCode> {
  const next = new Set(selection);
  if (next.has(code)) next.delete(code);
  else next.add(code);
  return next;
}
