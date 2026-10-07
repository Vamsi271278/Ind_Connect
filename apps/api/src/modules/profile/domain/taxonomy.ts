/** BR-PROF-011: at least one language on every save. */
export const LANGUAGES_MIN = 1;
/** Activation definition: at least three interests on every save. */
export const INTERESTS_MIN = 3;

export interface Language {
  readonly code: string;
  readonly displayName: string;
}

export interface Interest {
  readonly code: string;
  readonly label: string;
}

export interface InterestCategory {
  readonly code: string;
  readonly label: string;
  readonly interests: readonly Interest[];
}

/** A resolved, active interest: the internal id never leaves the server. */
export interface ResolvedInterest extends Interest {
  readonly id: string;
  readonly categoryCode: string;
}

/** A saved interest as the self projection shows it. */
export interface SelectedInterest extends Interest {
  readonly categoryCode: string;
}

/** Requested codes that are not currently available (unknown or inactive). */
export const unavailableCodes = (
  requested: readonly string[],
  available: ReadonlySet<string>,
): readonly string[] => requested.filter((code) => !available.has(code));
