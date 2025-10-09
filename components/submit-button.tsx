"use client";
import { useFormStatus } from "react-dom";

interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function SubmitButton({ children, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} {...props}>
      {pending && <span className="loading loading-spinner loading-xs" />}
      {children}
    </button>
  );
}
