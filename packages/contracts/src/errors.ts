import { Data } from "effect";

export class ContractDecodeError extends Data.TaggedError("ContractDecodeError")<{
  readonly schema: string;
  readonly message: string;
  readonly input: unknown;
}> {}
