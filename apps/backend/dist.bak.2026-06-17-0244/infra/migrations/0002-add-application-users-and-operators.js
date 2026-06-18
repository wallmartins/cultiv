// src/infra/migrations/0002-add-application-users-and-operators.ts
async function up(db) {
  await db.schema.createTable("application_users").addColumn("id", "varchar(64)", (col) => col.primaryKey()).addColumn("external_subject", "varchar(255)", (col) => col.notNull().unique()).addColumn("status", "varchar(16)", (col) => col.notNull().defaultTo("active")).addColumn("created_at", "varchar(64)", (col) => col.notNull()).addColumn("updated_at", "varchar(64)", (col) => col.notNull()).execute();
  await db.schema.createTable("operators").addColumn("id", "varchar(64)", (col) => col.primaryKey()).addColumn("permissions", "jsonb", (col) => col.notNull().defaultTo("[]")).addColumn("roles", "jsonb", (col) => col.notNull().defaultTo("[]")).addColumn("status", "varchar(16)", (col) => col.notNull().defaultTo("active")).addColumn("created_at", "varchar(64)", (col) => col.notNull()).addColumn("updated_at", "varchar(64)", (col) => col.notNull()).execute();
}
async function down(db) {
  await db.schema.dropTable("operators").ifExists().execute();
  await db.schema.dropTable("application_users").ifExists().execute();
}
export {
  down,
  up
};
//# sourceMappingURL=0002-add-application-users-and-operators.js.map
