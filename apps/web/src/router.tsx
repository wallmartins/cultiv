import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { DefaultCatchBoundary } from "./platform/components/DefaultCatchBoundary.js";
import { NotFound } from "./platform/components/NotFound.js";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true
  });
}
