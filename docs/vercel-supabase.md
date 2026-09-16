# Independent Vercel + Supabase deployment

deployment profile that can run independently on a separate Vercel domain with
its own Supabase project.

## 1. Create the Supabase project

1. Create a new Supabase project.
2. Open **SQL Editor** and run [`supabase/schema.sql`](../supabase/schema.sql).
3. Copy the project URL, anon key, service-role key, and the pooled Postgres
   connection string. Never put the service-role key in a `VITE_` variable.

## 2. Push the repository to GitHub

Push the repository root, not only `artifacts/fileit`. The Vercel function
imports the shared Express API and database packages from the monorepo.

## 3. Create the Vercel project

Import the GitHub repository into Vercel with the repository root as the project
root. The checked-in `vercel.json` builds the Fileit SPA and routes `/api/*` to
the serverless Express function.

Add the variables from [`.env.vercel.example`](../.env.vercel.example) to the
Vercel project. Add them to **Production**, and add them to **Preview** too if
you want preview deployments to use Supabase.

The server-only variables are:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`

The browser build variables are:

- `VITE_STORAGE_PROVIDER=supabase`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_STORAGE_BUCKET`

Deploy. The Vercel domain is an independent Fileit site. It uses only the
Supabase project configured in that Vercel environment.

## 4. Independent data

different Supabase project and Vercel environment variables for the Vercel
site. The sites do not share metadata or file bytes unless you intentionally
point both deployments at the same database and bucket.

## Important limits

The Supabase profile uploads file bytes directly from the browser using signed
Object Storage.
