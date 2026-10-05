import { z } from 'zod';

/** Success envelope: `{ "data": ... }`. */
export const dataEnvelope = <T extends z.ZodType>(data: T) => z.strictObject({ data });
