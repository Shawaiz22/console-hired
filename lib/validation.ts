import { z } from "zod";

/**
 * Route params arrive as arbitrary strings. Validating them as UUIDs keeps
 * malformed ids out of the database layer and gives a 400 instead of a 500.
 */
export const UuidSchema = z.string().uuid();

export function isUuid(value: string) {
  return UuidSchema.safeParse(value).success;
}
