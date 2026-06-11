import { createContext, useContext } from "react";
import type Lenis from "lenis";

export const LenisContext = createContext<Lenis | null>(null);

export function useLenisInstance(): Lenis | null {
  return useContext(LenisContext);
}
