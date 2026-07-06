"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * A hidden idempotency key for a write form. One key is held for as long as the
 * form is being (re-)submitted, so a double-click or retried delivery reuses the
 * same key and the server dedupes it. Once a submission finishes, the key rotates
 * so the next genuine submission from the same (still-mounted) form is allowed.
 *
 * The key is generated only on the client (empty during SSR) to avoid a
 * hydration mismatch.
 */
export function IdempotencyField() {
  const [key, setKey] = useState("");
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  useEffect(() => {
    // Generate on the client only (empty during SSR) to avoid a hydration
    // mismatch on the hidden input's value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!key) setKey(crypto.randomUUID());
  }, [key]);

  useEffect(() => {
    // Rotate after a submission completes (pending fell from true to false).
    if (wasPending.current && !pending) setKey(crypto.randomUUID());
    wasPending.current = pending;
  }, [pending]);

  return <input type="hidden" name="idempotency_key" value={key} />;
}
