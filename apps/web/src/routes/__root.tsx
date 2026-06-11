import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import type { ReactNode } from "react";
import { LenisProvider } from "~/animations/lenis-provider";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import appCss from "~/styles/app.css?url";
import { brandHeadLinks } from "~/brand/head-links";
import { seo } from "~/utils/seo";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      ...seo({
        title: "Cultiv",
        description: "Your authenticity, at scale."
      })
    ],
    links: [...brandHeadLinks(), { rel: "stylesheet", href: appCss }]
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: NotFound,
  shellComponent: RootDocument
});

function RootDocument({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <LenisProvider>{children}</LenisProvider>
        <Analytics />
        <Scripts />
      </body>
    </html>
  );
}
