// Server-side helpers for idempotent inserts. Forms carry a client-generated
// idempotency key (see <IdempotencyField/>); a partial unique index turns a
// repeated insert into a unique-violation, which we treat as "already done".

/** The submission's idempotency key, or null if the client didn't send one. */
export function idemKey(formData: FormData): string | null {
  const k = String(formData.get("idempotency_key") ?? "").trim();
  return k || null;
}

/** True when a Postgres error is a unique-constraint violation (23505). */
export function isDuplicate(
  error: { code?: string } | null | undefined,
): boolean {
  return error?.code === "23505";
}
