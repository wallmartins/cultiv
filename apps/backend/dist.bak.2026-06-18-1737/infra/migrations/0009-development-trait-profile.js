// src/infra/migrations/0009-development-trait-profile.ts
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
//# sourceMappingURL=0009-development-trait-profile.js.map
