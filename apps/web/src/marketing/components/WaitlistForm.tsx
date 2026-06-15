import { useState, type FormEvent } from "react";
import { Button, Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { getPrivacyPath } from "~/i18n/marketing/get-locale";
import type { LocaleMessages, MarketingLocale } from "~/i18n/marketing/types";
import { submitWaitlistAction } from "~/platform/server/waitlist-action";
import { isWaitlistSuccess } from "~/platform/services/waitlist/waitlist-result";

export interface WaitlistFormProps {
  readonly locale: MarketingLocale;
  readonly copy: LocaleMessages["waitlist"];
}

type FormStatus = "idle" | "submitting" | "success" | "error";

const fieldClassName =
  "w-full border-0 border-b border-invert-foreground/25 bg-transparent py-3.5 font-body text-[1.0625rem] text-invert-foreground placeholder:text-invert-foreground/30 transition-colors duration-200 focus:border-golden focus:outline-none";

export function WaitlistForm({ locale, copy }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const result = await submitWaitlistAction({
      data: {
        email,
        name: name.trim() ? name.trim() : undefined,
        locale,
        consentAt: consent ? new Date().toISOString() : ""
      }
    });

    if (isWaitlistSuccess(result)) {
      setStatus("success");
      return;
    }

    setStatus("error");
    if (result.code === "rate_limited") {
      setErrorMessage(copy.errors.rateLimited);
      return;
    }

    if (result.code === "provider_error") {
      setErrorMessage(copy.errors.provider);
      return;
    }

    setErrorMessage(copy.errors.validation);
  }

  if (status === "success") {
    return (
      <div className="waitlist-form-panel space-y-4">
        <Text as="p" variant="meta" className="text-golden">
          [ ok ]
        </Text>
        <Text as="p" variant="body-lg" className="max-w-md font-handwritten text-2xl text-golden">
          {copy.success}
        </Text>
      </div>
    );
  }

  return (
    <form className="waitlist-form-panel space-y-10" onSubmit={onSubmit} noValidate>
      <div className="space-y-8">
        <label className="block space-y-3">
          <Text as="span" variant="meta" className="text-invert-foreground/55">
            {copy.emailLabel}
          </Text>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClassName}
          />
        </label>

        <label className="block space-y-3">
          <Text as="span" variant="meta" className="text-invert-foreground/55">
            {copy.nameLabel}
          </Text>
          <input
            type="text"
            name="name"
            autoComplete="name"
            placeholder={copy.namePlaceholder}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClassName}
          />
        </label>
      </div>

      <label className="flex gap-3.5">
        <span className="flex h-[1.85em] shrink-0 items-center">
          <input
            type="checkbox"
            name="consent"
            required
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="size-4 appearance-none border border-invert-foreground/35 bg-transparent checked:border-golden checked:bg-golden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-golden"
          />
        </span>
        <Text as="span" variant="body" className="leading-[1.85] text-invert-foreground/70">
          {copy.consentPrefix}{" "}
          <Link
            to={getPrivacyPath(locale)}
            className="text-invert-foreground underline decoration-golden/50 underline-offset-4 transition-colors hover:decoration-golden"
          >
            {copy.consentLink}
          </Link>
          .
        </Text>
      </label>

      {errorMessage ? (
        <Text as="p" variant="body" className="text-invert-foreground/70">
          {errorMessage}
        </Text>
      ) : null}

      <Button
        type="submit"
        variant="ghost"
        disabled={status === "submitting"}
        className="min-h-12 border border-golden bg-golden px-10 py-3.5 text-rich-soil hover:bg-transparent hover:text-golden disabled:opacity-50"
      >
        {status === "submitting" ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}
