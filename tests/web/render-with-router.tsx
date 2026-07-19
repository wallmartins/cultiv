/**
 * @vitest-environment jsdom
 */
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider
} from "@tanstack/react-router";
import { render, waitFor, type RenderOptions, type RenderResult } from "@testing-library/react";
import React, { type ReactElement } from "react";

// As superfícies do app são lazy (router.tsx as divide em chunks por rota), então render() volta
// antes do componente existir. Esperar a primeira pintura é parte do contrato de montagem —
// sem isto, um getBy* logo após o render lê um DOM ainda vazio.
export async function renderAndSettle(ui: ReactElement, options?: RenderOptions): Promise<RenderResult> {
  const result = render(ui, options);
  await waitFor(() => {
    expect(document.querySelector(".route-pending")).toBeNull();
    expect(document.body.textContent).not.toBe("");
  });
  return result;
}

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
