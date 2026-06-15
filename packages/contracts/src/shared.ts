import { Effect, ParseResult, Schema } from "effect";
import { ContractDecodeError } from "./errors.js";

export function createSchemaDecoder<A, I>(
  schemaName: string,
  schema: Schema.Schema<A, I>
): (input: unknown) => Effect.Effect<A, ContractDecodeError> {
  const decode = Schema.decodeUnknown(schema);

  return (input) =>
    decode(input).pipe(
      Effect.mapError(
        (error) =>
          new ContractDecodeError({
            schema: schemaName,
            message: ParseResult.TreeFormatter.formatErrorSync(error),
            input
          })
      )
    );
}
