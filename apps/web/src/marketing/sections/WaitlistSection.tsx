import { useState, type FormEvent } from "react";
import { Container } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { submitWaitlistAction } from "~/platform/server/waitlist-action";
import { isWaitlistSuccess } from "~/platform/services/waitlist/waitlist-result";
import { Link } from "@tanstack/react-router";
import { getPrivacyPath } from "~/i18n/marketing/get-locale";

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
        consentAt: consent ? new Date().toISOString() : ""
      }
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
      className="relative overflow-hidden bg-azul border-b border-azul/80 py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
    >
      <div className="rebrand-vignette absolute inset-0 pointer-events-none opacity-50" />

      <Container ref={sectionRef} className="relative z-10">
        <div className="mx-auto max-w-2xl text-center mb-10 md:mb-14" data-section-item>
          <span className="inline-block font-inter text-xs font-semibold uppercase tracking-widest text-ocre mb-4">
            {waitlist.eyebrow}
          </span>
          <h2 className="font-playfair text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight text-creme mb-4">
            {waitlist.title}
          </h2>
          <p className="font-inter text-base text-creme/70">
            {waitlist.description}
          </p>
        </div>

        <div className="mx-auto max-w-md" data-section-item>
          {status === "success" ? (
            <div className="text-center space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-musgo/40 bg-musgo/10">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-musgo">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="font-playfair text-xl text-creme">
                {waitlist.success}
              </p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={onSubmit} noValidate>
              <div>
                <label className="block mb-1.5">
                  <span className="font-inter text-xs font-semibold text-creme/60">
                    {waitlist.emailLabel}
                  </span>
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-sm border border-creme/20 bg-creme/5 px-4 py-3 font-inter text-sm text-creme placeholder:text-creme/30 focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota/30 transition-colors"
                />
              </div>

              <div>
                <label className="block mb-1.5">
                  <span className="font-inter text-xs font-semibold text-creme/60">
                    {waitlist.nameLabel}
                  </span>
                </label>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder={waitlist.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-sm border border-creme/20 bg-creme/5 px-4 py-3 font-inter text-sm text-creme placeholder:text-creme/30 focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota/30 transition-colors"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 appearance-none border border-creme/30 bg-transparent checked:border-terracota checked:bg-terracota focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracota"
                />
                <span className="font-inter text-xs leading-relaxed text-creme/60">
                  {waitlist.consentPrefix}{" "}
                  <Link
                    to={getPrivacyPath(locale)}
                    className="underline decoration-terracota/50 underline-offset-2 hover:text-creme transition-colors"
                  >
                    {waitlist.consentLink}
                  </Link>
                  .
                </span>
              </label>

              {errorMessage && (
                <p className="font-inter text-xs text-terracota">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="rebrand-hover w-full rounded-sm bg-terracota px-6 py-3.5 font-inter text-sm font-semibold text-white shadow-[3px_3px_0px_rgba(0,0,0,0.2)] transition-all duration-300 hover:bg-terracota/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "submitting" ? waitlist.submitting : waitlist.submit}
              </button>

              <p className="font-inter text-center text-xs text-creme/40">
                {waitlist.note}
              </p>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
