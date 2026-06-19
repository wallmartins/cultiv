// src/infra/migrations/0008-argument-development-signature.ts
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
//# sourceMappingURL=0008-argument-development-signature.js.map
