// src/infra/migrations/0004-add-voice-training-consents.ts
async function up(db) {
  await db.schema.createTable("voice_training_consents").addColumn("id", "varchar(64)", (col) => col.primaryKey()).addColumn("user_id", "varchar(64)", (col) => col.notNull().unique()).addColumn("data", "jsonb", (col) => col.notNull()).addColumn("version", "integer", (col) => col.notNull().defaultTo(1)).addColumn("created_at", "varchar(64)", (col) => col.notNull()).addColumn("updated_at", "varchar(64)", (col) => col.notNull()).execute();
}
async function down(db) {
  await db.schema.dropTable("voice_training_consents").ifExists().execute();
}
export {
  down,
  up
};
//# sourceMappingURL=0004-add-voice-training-consents.js.map
