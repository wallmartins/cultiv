// src/infra/migrations/0007-voice-reasoning-fields.ts
import { sql } from "kysely";
async function up(_db) {
  await sql`SELECT 1`.execute(_db);
}
async function down(_db) {
  await sql`SELECT 1`.execute(_db);
}
export {
  down,
  up
};
//# sourceMappingURL=0007-voice-reasoning-fields.js.map
