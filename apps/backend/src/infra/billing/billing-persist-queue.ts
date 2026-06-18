let billingPersistQueue: Promise<void> = Promise.resolve();

export function runBillingRepositoryPersistSerialized<T>(task: () => Promise<T>): Promise<T> {
  const next = billingPersistQueue.catch(() => undefined).then(task);
  billingPersistQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export function drainBillingRepositoryPersistQueue(): Promise<void> {
  return billingPersistQueue.catch(() => undefined);
}

export function scheduleBillingRepositoryPersist(task: () => Promise<void>): void {
  billingPersistQueue = runBillingRepositoryPersistSerialized(task).then(
    () => undefined,
    () => undefined
  );
}
