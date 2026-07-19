import { createContext, useContext, type ReactNode } from "react";
import type { AppRuntime } from "./runtime.js";

const RuntimeContext = createContext<AppRuntime | null>(null);

export interface RuntimeProviderProps {
  readonly runtime: AppRuntime;
  readonly children: ReactNode;
}

// The runtime is built once by the caller (runtime-loader, via makeAppRuntime) and handed down —
// the router's beforeLoad gate needs that same instance to run the SDK outside React.
//
// Por isso o provider NÃO dá dispose no unmount: a instância é memoizada fora do React e vive pela
// página inteira. Descartá-la no cleanup fazia StrictMode e HMR (mount → unmount → mount) matarem o
// singleton, e o remount recebia a mesma instância morta — "ManagedRuntime disposed" em toda
// chamada seguinte. Quem cria é quem descarta.
export function RuntimeProvider({ runtime, children }: RuntimeProviderProps) {
  return <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>;
}

export function useAppRuntime(): AppRuntime {
  const runtime = useContext(RuntimeContext);
  if (!runtime) {
    throw new Error("useAppRuntime must be used within a RuntimeProvider");
  }
  return runtime;
}
