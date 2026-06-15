import { Context, Layer } from "effect";
import type { BackendApplicationUserRepository } from "./application-user.js";

export class ApplicationUserService extends Context.Tag("ApplicationUserService")<
  ApplicationUserService,
  BackendApplicationUserRepository
>() {}

export function createApplicationUserServiceLayer(
  repository: BackendApplicationUserRepository
) {
  return Layer.succeed(ApplicationUserService, repository);
}
