# Fileit

Fileit is a no-sign-up file sharing app with persistent uploads, folders, QR
sharing, streamed folder ZIP downloads, and exact-preserving text/code snippets.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/fileit` — React/Vite web app.
- `artifacts/api-server` — shared Express API and storage provider adapters.
- `lib/db/src/schema` — PostgreSQL/Drizzle schema source of truth.
- `lib/api-spec/openapi.yaml` — API contract source of truth.
- `api/index.ts`, `vercel.json`, `supabase/schema.sql` — independent Vercel + Supabase profile.

## Architecture decisions

- Replit uses Replit Object Storage; the Vercel profile uses Supabase Storage through environment-selected adapters.
- Metadata is stored in PostgreSQL; file bytes are never stored in PostgreSQL.
- Folder share URLs use random tokens instead of database IDs.
- Text/code messages preserve the original content exactly and map language metadata to download extensions.

## Product

Users can upload and preview files, organize files into folders, move files by
drag-and-drop, share files or folders by link/QR code, download folder ZIPs,
and save exact-preserving text or code snippets linked to files.

## User preferences

- Keep the Replit deployment working independently from the optional Vercel + Supabase deployment.
- Keep service-role credentials server-only; only `VITE_SUPABASE_ANON_KEY` may be exposed to the browser.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after OpenAPI edits.
- Vercel uses `vercel.json` and the repository root; do not deploy only the frontend subdirectory.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
