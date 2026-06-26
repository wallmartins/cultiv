import { useAuth0 } from "@auth0/auth0-react";
import { ButtonLink, type ButtonLinkProps } from "@my-ai-orchestrator/ui";
import {
  buildMarketingConversionUrl,
  type MarketingAuthIntent,
} from "~/marketing/auth/marketing-auth-intent";

export function MarketingConversionLink(
  props: Omit<ButtonLinkProps, "href"> & { readonly intent: MarketingAuthIntent }
) {
  const { isAuthenticated } = useAuth0();
  const href = buildMarketingConversionUrl(props.intent, { isAuthenticated });
  const { intent: _intent, ...buttonProps } = props;
  return <ButtonLink href={href} {...buttonProps} />;
}
