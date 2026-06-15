import { createPrivateKey, createPublicKey, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { backendPackageRoot } from "../package-root.js";

const localDevPrivateKeyPem = readFileSync(
  join(backendPackageRoot, "src/auth/dev-local-auth-key.pem"),
  "utf8"
);

export function createLocalDevAuthKeyPair(): {
  readonly privateKey: KeyObject;
  readonly publicKey: KeyObject;
} {
  const privateKey = createPrivateKey(localDevPrivateKeyPem);
  const publicKey = createPublicKey(privateKey);

  return { privateKey, publicKey };
}
