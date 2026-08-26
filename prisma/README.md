# Applying migrations in this project

`npx prisma migrate dev` will fail for **every** migration from now on — not just ones
that touch `auth.*`. Read this before you hit `P3006`/`P3018`.

## Why

`prisma migrate dev` validates a migration by replaying the **entire** migration
history against a fresh, empty shadow database, then diffing. Our history permanently
contains migrations that create objects in Supabase-managed schemas (`auth.users`
triggers, as of `20260826195216_admin_profile_trigger`). A bare shadow Postgres has no
`auth` schema — Supabase provisions that only in the real project database — so replay
always fails with:

```
Error: P3006
Migration `<name>` failed to apply cleanly to the shadow database.
Error code: P3018
Database error:
ERROR: schema "auth" does not exist
```

This happens even for a brand-new migration that only touches `public` tables, because
the shadow DB replays *every prior* migration first, including the `auth.*` ones.

## How to apply a new migration here

1. Write the migration by hand (or `prisma migrate diff` it), and put it in
   `prisma/migrations/<timestamp>_<name>/migration.sql`. Do **not** run
   `prisma migrate dev` to generate/apply it — use `--create-only` if you want Prisma
   to scaffold the empty file and timestamp for you:

   ```bash
   npx prisma migrate dev --create-only --name <name>
   ```

   (This step itself doesn't touch the shadow DB, only `--create-only` runs; applying
   is what fails.)

2. Apply the SQL directly to the real database:

   ```bash
   npx prisma db execute --file "prisma/migrations/<timestamp>_<name>/migration.sql"
   ```

3. Record it in Prisma's migration history so `prisma migrate status` and future
   diffs know it's applied, without re-running it:

   ```bash
   npx prisma migrate resolve --applied <timestamp>_<name>
   ```

4. Verify:

   ```bash
   npx prisma migrate status
   ```

   should report "Database schema is up to date!".

Never edit an already-applied migration file in place (its checksum is recorded in
`_prisma_migrations`) — always add a new migration directory, even for a fix to a
previous one.

## Escape hatch: restoring normal `migrate dev`

If this becomes painful enough to fix properly, point Prisma's shadow database at a
Postgres instance that already has Supabase's managed schemas (`auth`, `storage`,
etc.) instead of an empty one it creates itself — e.g. a dedicated Supabase branch/shadow
project, or a local Postgres seeded with a dump of those schemas. Set it via
`shadowDatabaseUrl` in `prisma.config.ts`'s `datasource` block:

```ts
datasource: {
  url: env("DIRECT_URL"),
  shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
},
```

With that in place, `prisma migrate dev` goes back to working normally, including for
migrations that reference `auth.*`.
