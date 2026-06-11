import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { DeferredAnalytics } from "~/components/DeferredAnalytics";
import type { ReactNode } from "react";
import { DeferredLenisProvider } from "~/animations/deferred-lenis-provider";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import appCss from "~/styles/app.css?url";
import { brandHeadLinks, googleFontsAsyncScript } from "~/brand/head-links";
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
    links: [...brandHeadLinks(), { rel: "stylesheet", href: appCss }],
    scripts: [{ type: "text/javascript", children: googleFontsAsyncScript }]
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
        <DeferredLenisProvider>{children}</DeferredLenisProvider>
        <DeferredAnalytics />
        <Scripts />
      </body>
    </html>
  );
}
