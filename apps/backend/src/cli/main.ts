import { Effect } from "effect";
import { startBackendServer } from "../app/bootstrap.js";
import { toErrorMessage } from "../http/http.js";

declare const process: {
  readonly exit: (code?: number) => never;
};

Effect.runPromise(startBackendServer()).catch((error) => {
  console.error(toErrorMessage(error));
  process.exit(1);
});
