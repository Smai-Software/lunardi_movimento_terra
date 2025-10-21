function flattenValidationErrors(errors?: unknown): string[] {
  const collectedMessages: string[] = [];

  const visit = (node: unknown) => {
    if (!node) return;

    if (Array.isArray(node)) {
      for (const child of node) {
        visit(child);
      }
      return;
    }

    if (typeof node === "object") {
      const record = node as { [key: string]: unknown; _errors?: unknown };
      const maybeErrors = record._errors;
      if (Array.isArray(maybeErrors)) {
        for (const message of maybeErrors) {
          if (typeof message === "string") {
            collectedMessages.push(message);
          }
        }
      }
      for (const [key, value] of Object.entries(record)) {
        if (key === "_errors") continue;
        visit(value);
      }
    }
  };

  visit(errors);
  return collectedMessages;
}

type ActionResultLike =
  | {
      validationErrors?: unknown;
      data?: { error?: string | null } | null;
      serverError?: string | null;
    }
  | undefined;

type ValidationErrorsProps =
  | { errors: unknown; result?: never }
  | { errors?: never; result: ActionResultLike };

export function ValidationErrors(props: ValidationErrorsProps) {
  const messagesFromValidation = flattenValidationErrors(
    "errors" in props ? props.errors : props.result?.validationErrors,
  );

  const combinedMessages: string[] = [];
  if (props.result?.data && typeof props.result.data.error === "string") {
    combinedMessages.push(props.result.data.error);
  }
  if (
    props.result &&
    typeof props.result.serverError === "string" &&
    props.result.serverError
  ) {
    combinedMessages.push(props.result.serverError);
  }
  combinedMessages.push(...messagesFromValidation);

  if (combinedMessages.length === 0) return null;
  return (
    <div>
      {combinedMessages.map((message, index) => (
        <p
          key={`${index}-${message}`}
          className="alert alert-error alert-soft mt-2"
        >
          {message}
        </p>
      ))}
    </div>
  );
}
