# Database Migration Guide

## Setup

This project uses **TypeORM migrations** for all database schema changes.
`synchronize: false` is used — migrations are the only way to change the schema.

Migration commands read from `.env` automatically via `dotenv.config()` in
`src/database/data-source.ts`. If `DATABASE_URL` is set it takes priority over
the individual `DATABASE_*` variables.

## Available Commands

```bash
# Run all pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Show migration status (which are pending/run)
npm run migration:show

# Generate a new migration from entity changes (path is required)
npm run migration:generate src/database/migrations/YourMigrationName
```

## Workflow — Making a Schema Change

### Step 1: Edit the entity file
```typescript
// src/products/product.entity.ts
@Column({ type: 'numeric', precision: 3, scale: 2, default: 0 })
avg_rating: number;
```

### Step 2: Generate migration from the entity diff
```bash
npm run migration:generate src/database/migrations/AddProductAvgRating
```
TypeORM compares your entities against the current DB and generates the SQL.

### Step 3: Review the generated migration
```typescript
export class AddProductAvgRating1700000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD "avg_rating" numeric(3,2) NOT NULL DEFAULT '0'`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "avg_rating"`);
  }
}
```

### Step 4: Apply it
```bash
npm run migration:run
```

### Step 5: Commit the migration file
```bash
git add src/database/migrations/
git commit -m "migration: add avg_rating to products"
```

## Initial Setup (Fresh Database)

```bash
# 1. Make sure the database exists
createdb dgs_db

# 2. Run all migrations (creates every table)
npm run migration:run

# 3. Seed initial data
npm run seed:admin      # roles + admin users (required)
npm run seed:milanova   # optional demo content dataset
```

## Migration History

Schema history lives entirely in `src/database/migrations/`:

- `1750000000000-InitialSchema` — the base schema.
- A long series of additive migrations that evolve it (catalogue, orders,
  CMS, servicing, notifications, loyalty, testimonials, technologies, …).
- `1791200000000-DropPermissionTables` — **drops the permission tables**.
  The application no longer has a permission system: every authenticated admin
  user has full access, and access is governed purely by roles and users
  (`roles.is_system`, role name `owner`, and self-target checks).

> Earlier migrations that inserted permission rows still run for historical
> fidelity, but the tables they reference are removed by the drop migration, so
> they have no lasting effect.

## Common Change Examples

### Add a column
```typescript
await queryRunner.query(`
  ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "notes" TEXT
`);
```

### Add a column with a default
```typescript
await queryRunner.query(`
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT false
`);
```

### Rename a column
```typescript
await queryRunner.query(`ALTER TABLE "orders" RENAME COLUMN "note" TO "internal_note"`);
```

### Add an index
```typescript
await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders" ("status")`);
```

### Add a new table with a foreign key
```typescript
await queryRunner.query(`
  CREATE TABLE "product_reviews" (
    "id"          BIGSERIAL PRIMARY KEY,
    "product_id"  BIGINT    NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "customer_id" BIGINT    NOT NULL REFERENCES "customers"("id"),
    "rating"      INTEGER   NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
    "body"        TEXT,
    "created_at"  TIMESTAMP NOT NULL DEFAULT NOW()
  )
`);
```

### Change a column type
```typescript
// Always handle data conversion!
await queryRunner.query(`
  ALTER TABLE "product_variants"
    ALTER COLUMN "price" TYPE NUMERIC(12,2)
`);
```

### Add a NOT NULL column to an existing table
```typescript
// Step 1: Add nullable
await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN "priority" VARCHAR(20)`);
// Step 2: Fill existing rows
await queryRunner.query(`UPDATE "orders" SET "priority" = 'normal' WHERE "priority" IS NULL`);
// Step 3: Add the constraint + default
await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "priority" SET NOT NULL`);
await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "priority" SET DEFAULT 'normal'`);
```

## Production Deployment

```bash
# Run migrations before starting the app
npm run migration:run && npm run start:prod

# Or in a Dockerfile / CI pipeline:
CMD ["sh", "-c", "npm run migration:run && node dist/main"]
```

## Environment Variables

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=change-me
DATABASE_NAME=dgs_db

# DATABASE_URL takes priority over the DATABASE_* variables when set
# DATABASE_URL=postgresql://postgres:change-me@localhost:5432/dgs_db
```
