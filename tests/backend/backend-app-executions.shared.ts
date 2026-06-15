import {
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices,
  seedExecutionVoiceState
} from "./backend-app.fixtures.js";

export function createExecutionApp(executionMode: "sync" | "async") {
  const config = createBackendAppTestConfig({
    billingUserId: "user_1",
    executionMode
  });
  const services = createBackendAppTestServices(config);
  seedExecutionVoiceState(services);
  const app = createBackendAppTestApp(config, services);
  return { app, services };
}
