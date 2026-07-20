import { useEffect, useState } from "react";

// useDeferredValue só desprioriza o render — não segura a rede. Para um valor que vira queryKey
// (a busca do histórico), o que evita um request por tecla é esperar a digitação parar.
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
