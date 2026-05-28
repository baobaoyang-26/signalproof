export type OrderFieldValues = {
  email: string;
  startupIdea: string;
};

export type OrderFieldKey = keyof OrderFieldValues;

export type OrderValidationResult = {
  emailValid: boolean;
  ideaValid: boolean;
  allValid: boolean;
  fieldErrors: Partial<Record<OrderFieldKey, string>>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_IDEA_LENGTH = 16;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && EMAIL_PATTERN.test(trimmed);
}

export function isValidStartupIdea(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= MIN_IDEA_LENGTH;
}

export function validateOrderFields(values: OrderFieldValues): OrderValidationResult {
  const emailValid = isValidEmail(values.email);
  const ideaValid = isValidStartupIdea(values.startupIdea);

  const fieldErrors: Partial<Record<OrderFieldKey, string>> = {};
  if (!emailValid) {
    fieldErrors.email = values.email.trim()
      ? "Enter a valid email address."
      : "Email is required.";
  }
  if (!ideaValid) {
    fieldErrors.startupIdea =
      values.startupIdea.trim().length > 0
        ? "Add a few more words—your idea, who it serves, or the market insight you are testing."
        : "Describe your startup idea is required.";
  }

  return {
    emailValid,
    ideaValid,
    allValid: emailValid && ideaValid,
    fieldErrors,
  };
}
