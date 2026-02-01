"use client";
import { useFormStatus } from "react-dom";

interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  /** When provided (e.g. for fetch-based forms), overrides useFormStatus pending */
  isPending?: boolean;
}

export function SubmitButton({
  children,
  isPending: isPendingProp,
  ...props
}: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const pending = isPendingProp ?? formPending;

  return (
    <button type="submit" disabled={pending} {...props}>
      {pending && <span className="loading loading-spinner loading-xs" />}
      {children}
    </button>
  );
}
