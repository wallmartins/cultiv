import { Context, Layer } from "effect";
import type { BackendOperatorRepository } from "./operator.js";

export class OperatorService extends Context.Tag("OperatorService")<
  OperatorService,
  BackendOperatorRepository
>() {}

export function createOperatorServiceLayer(
  repository: BackendOperatorRepository
) {
  return Layer.succeed(OperatorService, repository);
}
