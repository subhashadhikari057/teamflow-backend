# Prisma Commands

This project uses:

- Prisma schema: `prisma/schema.prisma`
- Prisma config: `prisma.config.ts`
- Nest Prisma service: `src/infrastructure/database/prisma.service.ts`

## Quick meaning

- `generate` updates Prisma client code
- `migrate:dev` creates a new migration and applies it
- `migrate:deploy` applies existing migrations only
- `studio` opens Prisma Studio UI

## Commands

### Generate Prisma client

```bash
pnpm prisma:generate
```

Use this when:

- you changed `prisma/schema.prisma`
- you want updated Prisma types and client code
- you did not necessarily want to create a migration

What it does:

- reads the Prisma schema
- generates `@prisma/client`
- updates TypeScript types and Prisma client API

It does not:

- create database tables
- apply database changes
- create migration files

### Create and apply a new migration

```bash
pnpm prisma:migrate:dev --name init
```

Example:

```bash
pnpm prisma:migrate:dev --name add-user-table
```

Use this when:

- you changed `prisma/schema.prisma`
- you want Prisma to create a new migration
- you want that migration applied to your local database

What it does:

- compares schema to your current database state
- creates a new folder inside `prisma/migrations`
- applies the migration to your local database
- usually regenerates Prisma client too

This is the command that creates migration files.

### Apply existing migrations only

```bash
pnpm prisma:migrate:deploy
```

Use this when:

- migration files already exist
- you only want to apply them to the database
- you do not want Prisma to create a new migration

What it does:

- runs existing migrations from `prisma/migrations`
- updates the database to match those migration files

It does not:

- create a new migration

### Open Prisma Studio

```bash
pnpm prisma:studio
```

Use this when:

- you want to browse or edit database rows in a UI

## Normal local flow

### If you changed the Prisma schema and need a new migration

```bash
pnpm prisma:migrate:dev --name describe-your-change
pnpm dev
```

Example:

```bash
pnpm prisma:migrate:dev --name add-user-table
pnpm dev
```

### If migrations already exist and you only want to sync the DB

```bash
pnpm prisma:migrate:deploy
pnpm prisma:generate
pnpm dev
```

### If you only need fresh Prisma client types

```bash
pnpm prisma:generate
```

## Easy memory trick

- `generate` = update code
- `migrate:dev` = create migration + apply it
- `migrate:deploy` = apply existing migrations
- `studio` = open DB UI
