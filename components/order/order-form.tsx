"use client";

import { useState } from "react";
import { submitOrderForm, type OrderFormState } from "@/app/order/actions";
import { validateOrderFields } from "@/lib/order-form-validation";
import { markExpectingCheckoutReturn, savePendingOrderId } from "@/lib/pending-order";
import { ORDER_PAGE, PRIMARY_CTA } from "@/lib/site-copy";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-canvas/80 px-4 py-3.5 text-base text-white outline-none transition placeholder:text-subtle/90 placeholder:leading-relaxed focus:border-accent/50 focus:ring-1 focus:ring-accent/30";

const inputErrorClass =
  "border-danger/40 focus:border-danger/50 focus:ring-danger/30";

export function OrderForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [serverState, setServerState] = useState<OrderFormState>({});
  const [values, setValues] = useState({
    email: "",
    startupIdea: "",
    additionalContext: "",
  });

  const validation = validateOrderFields(values);
  const { allValid, fieldErrors } = validation;

  const clientFieldErrors = showErrors ? fieldErrors : {};
  const mergedFieldErrors = { ...clientFieldErrors, ...serverState.fieldErrors };

  const buttonDisabled = isSubmitting || !allValid;

  function updateField(name: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShowErrors(true);

    if (!allValid) return;

    setIsSubmitting(true);
    setServerState({});

    console.info("[SignalProof] submit order");

    const formData = new FormData(e.currentTarget);
    const result = await submitOrderForm({}, formData);

    if (result.fieldErrors) {
      setServerState(result);
      setIsSubmitting(false);
      return;
    }

    if (result.error) {
      setServerState(result);
      setIsSubmitting(false);
      return;
    }

    if (!result.orderId || !result.checkoutUrl) {
      setServerState({ error: "Checkout could not be started. Please try again." });
      setIsSubmitting(false);
      return;
    }

    console.info("[SignalProof] local order created orderId=", result.orderId);
    savePendingOrderId(result.orderId);
    markExpectingCheckoutReturn();
    console.info("[SignalProof] pendingOrderId saved");
    console.info("[SignalProof] redirecting checkout");
    window.location.assign(result.checkoutUrl);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <input name="plan" type="hidden" value="single_memo" />

      {serverState.error ? (
        <p
          className="mb-6 rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm leading-7 text-warn"
          role="alert"
        >
          {serverState.error}
        </p>
      ) : null}

      <div className="grid gap-6">
        <Field
          error={mergedFieldErrors.email}
          label={ORDER_PAGE.labels.email}
          name="email"
          onChange={(v) => updateField("email", v)}
          placeholder={ORDER_PAGE.placeholders.email}
          type="email"
          value={values.email}
        />

        <label className="grid gap-2.5">
          <span className="text-sm font-medium text-white/90">
            {ORDER_PAGE.labels.startupIdea}
          </span>
          <textarea
            aria-invalid={Boolean(mergedFieldErrors.startupIdea)}
            className={`${inputClass} min-h-[9rem] resize-y ${mergedFieldErrors.startupIdea ? inputErrorClass : ""}`}
            name="startupIdea"
            onChange={(e) => updateField("startupIdea", e.target.value)}
            placeholder={ORDER_PAGE.placeholders.startupIdea}
            required
            value={values.startupIdea}
          />
          {mergedFieldErrors.startupIdea ? (
            <p className="text-xs leading-5 text-danger" role="alert">
              {mergedFieldErrors.startupIdea}
            </p>
          ) : null}
        </label>

        <label className="grid gap-2.5">
          <span className="text-sm font-medium text-white/90">
            {ORDER_PAGE.labels.referenceLink}
            <span className="ml-1 font-normal text-subtle">(optional)</span>
          </span>
          <input
            className={inputClass}
            name="additionalContext"
            onChange={(e) => updateField("additionalContext", e.target.value)}
            placeholder={ORDER_PAGE.placeholders.referenceLink}
            type="text"
            value={values.additionalContext}
          />
        </label>
      </div>

      <button
        aria-busy={isSubmitting}
        className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-canvas transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={buttonDisabled}
        type="submit"
      >
        {isSubmitting ? ORDER_PAGE.submitPending : PRIMARY_CTA}
      </button>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: "email";
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
  error?: string;
};

function Field({ label, name, value, onChange, placeholder, type, error }: FieldProps) {
  return (
    <label className="grid gap-2.5">
      <span className="text-sm font-medium text-white/90">{label}</span>
      <input
        aria-invalid={Boolean(error)}
        autoComplete={name === "email" ? "email" : undefined}
        className={`${inputClass} ${error ? inputErrorClass : ""}`}
        name={name}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? (
        <p className="text-xs leading-5 text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  );
}
