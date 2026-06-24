import { useState, type FormEvent } from "react";
import {
  Button,
  Container,
  CoordinateLabel,
  Input,
  Text,
  cn,
} from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import {
  getLocaleMessages,
  getPrivacyPath,
} from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { submitWaitlistAction } from "~/platform/server/waitlist-action";
import { isWaitlistSuccess } from "~/platform/services/waitlist/waitlist-result";

export interface WaitlistSectionProps {
  readonly locale: MarketingLocale;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

export function WaitlistSection({ locale }: WaitlistSectionProps) {
  const { waitlist } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");
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
        consentAt: consent ? new Date().toISOString() : "",
      },
    });

    if (isWaitlistSuccess(result)) {
      setStatus("success");
      return;
    }

    setStatus("error");
    if (result.code === "rate_limited") {
      setErrorMessage(waitlist.errors.rateLimited);
      return;
    }
    if (result.code === "provider_error") {
      setErrorMessage(waitlist.errors.provider);
      return;
    }
    setErrorMessage(waitlist.errors.validation);
  }

  return (
    <section
      id="waitlist"
      className="border-b border-deep-blue/20 bg-deep-blue text-cream"
    >
      <Container
        ref={sectionRef}
        className="py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
      >
        <header
          className="mx-auto mb-10 max-w-2xl text-center md:mb-14"
          data-section-item
        >
          <CoordinateLabel
            index={8}
            label={waitlist.eyebrow}
            className="mb-4 block text-cream/60"
          />
          <Text as="h2" variant="display" className="text-cream">
            {waitlist.title}
          </Text>
          <Text as="p" variant="body" className="mt-4 text-cream/70">
            {waitlist.description}
          </Text>
        </header>

        <div className="mx-auto max-w-md" data-section-item>
          {status === "success" ? (
            <div className="space-y-4 text-center">
              <Text as="p" variant="display-sm" className="text-cream">
                {waitlist.success}
              </Text>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={onSubmit} noValidate>
              <div>
                <label className="mb-1.5 block">
                  <Text as="span" variant="mono" className="text-cream/60">
                    {waitlist.emailLabel}
                  </Text>
                </label>
                <Input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block">
                  <Text as="span" variant="mono" className="text-cream/60">
                    {waitlist.nameLabel}
                  </Text>
                </label>
                <Input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder={waitlist.namePlaceholder}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className={cn(
                    "mt-1 h-4 w-4 shrink-0 appearance-none rounded-[3px]",
                    "border border-cream/30 bg-transparent",
                    "checked:border-terracotta checked:bg-terracotta",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                  )}
                />
                <Text as="span" variant="body" className="text-cream/60">
                  {waitlist.consentPrefix}{" "}
                  <Link
                    to={getPrivacyPath(locale)}
                    className="underline decoration-terracotta/50 underline-offset-2 transition-colors hover:text-cream"
                  >
                    {waitlist.consentLink}
                  </Link>
                  .
                </Text>
              </label>

              {errorMessage ? (
                <Text as="p" variant="body" className="text-terracotta">
                  {errorMessage}
                </Text>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                disabled={status === "submitting"}
                className="w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "submitting" ? waitlist.submitting : waitlist.submit}
              </Button>

              <Text as="p" variant="mono" className="text-center text-cream/45">
                {waitlist.note}
              </Text>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
