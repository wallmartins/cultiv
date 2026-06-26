import type { LegalDocument } from "../types.js";

export const privacyEn: LegalDocument = {
  title: "Privacy Policy",
  sections: [
    {
      heading: "Data we collect",
      body: "When you create an account, we collect email and profile data needed to operate the service. When using the product, we may process voice examples and generated text as described here."
    },
    {
      heading: "Purpose",
      body: "We use your data to operate the service, authenticate your account, and communicate Cultiv updates. We do not sell your data."
    },
    {
      heading: "Processors",
      body: "Authentication is managed by Auth0. Payments are processed by Stripe or Asaas depending on your region."
    },
    {
      heading: "Your rights",
      body: "You may request access, correction, or deletion of your data by contacting contact@cultiv.app."
    }
  ]
};
