import { Either, Effect, Schema } from "effect";
import type { Context } from "hono";
import {
  type ApiErrorResponse,
  ApiErrorResponseSchema
} from "@my-ai-orchestrator/contracts";
import {
  BackendRequestBodyParseError,
  BackendResponseValidationError
} from "./errors.js";

export async function readJsonBody(c: Context, route: string): Promise<unknown> {
  try {
    return await c.req.json();
  } catch (error) {
    throw new BackendRequestBodyParseError({
      route,
      message: toErrorMessage(error)
    });
  }
}

export async function runEffectOrThrow<A, E, R = never>(effect: Effect.Effect<A, E, R>): Promise<A> {
  const result = await Effect.runPromise(Effect.either(effect) as Effect.Effect<Either.Either<A, E>, never, never>);

  if (Either.isLeft(result)) {
    throw result.left;
  }

  return result.right;
}

export async function validateResponseBody<A, I, R = never>(
  schema: Schema.Schema<A, I, R>,
  body: A,
  schemaName: string
): Promise<A> {
  try {
    return await runEffectOrThrow(Effect.orDie(Schema.decodeUnknown(schema)(body)));
  } catch (error) {
    throw new BackendResponseValidationError({
      schema: schemaName,
      message: toErrorMessage(error)
    });
  }
}

export async function createErrorBody(body: ApiErrorResponse): Promise<ApiErrorResponse> {
  return validateResponseBody(ApiErrorResponseSchema, body, "ApiErrorResponse");
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "Unknown error";
}
