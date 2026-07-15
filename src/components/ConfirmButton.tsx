"use client";

import { useEffect, useState } from "react";

/**
 * A submit button that asks for a second click before it fires — a gentle guard
 * on destructive actions. First click arms it (showing the confirm label);
 * clicking again submits. It disarms on blur or after a few seconds.
 */
export function ConfirmButton({
  children,
  confirm = "Confirm?",
  className = "",
  confirmClassName = "text-red-700 font-medium",
  formAction,
  name,
  value,
}: {
  children: React.ReactNode;
  confirm?: React.ReactNode;
  className?: string;
  confirmClassName?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  name?: string;
  value?: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      type="submit"
      formAction={formAction}
      name={name}
      value={value}
      onClick={(e) => {
        if (!armed) {
          e.preventDefault();
          setArmed(true);
        }
      }}
      onBlur={() => setArmed(false)}
      className={`${className} ${armed ? confirmClassName : ""}`}
    >
      {armed ? confirm : children}
    </button>
  );
}
