"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that disables itself while its form is submitting — the first
 * line of defence against double-submits. Pairs with <IdempotencyField/> and the
 * server-side dedupe for the cases a disabled button can't catch (retries, etc.).
 */
export function SubmitButton({
  children,
  pendingLabel,
  className = "",
  formAction,
}: {
  children: React.ReactNode;
  pendingLabel?: React.ReactNode;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
