import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { AppRuntime } from "./runtime.js";

const RuntimeContext = createContext<AppRuntime | null>(null);

export interface RuntimeProviderProps {
  readonly runtime: AppRuntime;
  readonly children: ReactNode;
}

// The runtime is built once by the caller (main.tsx, via makeAppRuntime) and handed down —
// the router's beforeLoad gate needs that same instance to run the SDK outside React.
export function RuntimeProvider({ runtime, children }: RuntimeProviderProps) {
  useEffect(() => () => void runtime.dispose(), [runtime]);

  return <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>;
}

export function useAppRuntime(): AppRuntime {
  const runtime = useContext(RuntimeContext);
  if (!runtime) {
    throw new Error("useAppRuntime must be used within a RuntimeProvider");
  }
  return runtime;
}
