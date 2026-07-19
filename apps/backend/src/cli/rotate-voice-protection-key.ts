import { Effect } from "effect";
import { Kysely, PostgresDialect } from "kysely";
import { bootstrapBackendConfig } from "../config/config.js";
import { acquirePostgresPool, releasePostgresPool } from "../infra/postgres-bootstrap.js";
import type { DatabaseTables } from "../infra/postgres-tables.js";
import { rotateVoiceFieldProtectionInDatabase } from "../safety/voice-field-protection-rotation.js";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const encryptPlaintext = process.argv.includes("--encrypt-plaintext");
  const config = bootstrapBackendConfig();

  if (!config.databaseUrl) {
    console.error("DATABASE_URL is required to rotate voice protection keys");
    process.exit(1);
  }

  if (!config.voiceDataProtectionKey) {
    console.error("VOICE_DATA_PROTECTION_KEY is required to rotate voice protection keys");
    process.exit(1);
  }

  if (config.voiceDataProtectionPreviousKey && config.voiceDataProtectionPreviousKey === config.voiceDataProtectionKey) {
    console.error("VOICE_DATA_PROTECTION_KEY_PREVIOUS must differ from VOICE_DATA_PROTECTION_KEY");
    process.exit(1);
  }

  const pool = await Effect.runPromise(acquirePostgresPool(config.databaseUrl));

  try {
    const db = new Kysely<DatabaseTables>({ dialect: new PostgresDialect({ pool }) });
    const result = await Effect.runPromise(
      rotateVoiceFieldProtectionInDatabase({
        db,
        dryRun,
        encryptPlaintext,
        keys: {
          keyMaterial: config.voiceDataProtectionKey,
          previousKeyMaterial: config.voiceDataProtectionPreviousKey
        }
      })
    );

    console.info(dryRun ? "Voice protection key rotation dry-run completed:" : "Voice protection key rotation completed:", result);

    if (result.voiceExamplesRotated === 0) {
      console.info(
        encryptPlaintext
          ? "No voice fields required rotation or plaintext encryption."
          : "No protected voice fields required rotation. Pass --encrypt-plaintext to encrypt legacy plaintext rows."
      );
    } else if (!dryRun && config.voiceDataProtectionPreviousKey) {
      console.info("Remove VOICE_DATA_PROTECTION_KEY_PREVIOUS from the environment after verifying reads in production.");
    }
  } catch (error) {
    console.error("Voice protection key rotation failed:", error);
    process.exit(1);
  } finally {
    await Effect.runPromise(releasePostgresPool(pool));
  }
}

main();
