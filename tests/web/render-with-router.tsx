/**
 * @vitest-environment jsdom
 */
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider
} from "@tanstack/react-router";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import React, { type ReactElement } from "react";

export async function renderWithRouter(
  ui: ReactElement,
  initialPath = "/history",
  options?: RenderOptions
): Promise<RenderResult> {
  const rootRoute = createRootRoute({
    component: () => ui
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [initialPath] })
  });

  await router.load();

  return render(<RouterProvider router={router} />, options);
}
