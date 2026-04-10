# Supabase Setup

This project uses Supabase in both the Vite client and the Node signaling server.

## Environment variables

Create a root `.env` file with the following keys:

```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Apply the schema

Load the SQL migrations in `supabase/migrations` into the new Supabase project.

Apply them in this order:

1. `20250319054244_azure_waterfall.sql`
2. `20250319071838_shiny_spire.sql`
3. `20250319073255_late_waterfall.sql`
4. `20250319075757_tiny_meadow.sql`
5. `20250319142841_fading_waterfall.sql`
6. `20250319145139_lingering_palace.sql`
7. `20250319145459_wandering_paper.sql`
8. `20250319174759_lively_boat.sql`
9. `20250319175804_crystal_smoke.sql`
10. `20250319180141_jolly_pine.sql`
11. `20250319193854_warm_forest.sql`
12. `20250319194245_round_union.sql`
13. `20250319194840_square_truth.sql`
14. `20250319200046_still_lagoon.sql`
15. `20250319200952_humble_dust.sql`
16. `20250320054813_red_coast.sql`
17. `20250320065731_sweet_flower.sql`
18. `20250409000000_missing_app_tables.sql`

## Tables the app expects

The app code queries these tables:

- `admins`
- `doctors`
- `user_profiles`
- `doctor_patient_connections`
- `doctor_patient_chats`
- `reviews`
- `questions`
- `ai_chats`
- `health_articles`
- `chat_history`
- `ai_question_counter`

The first eight are covered by the repo migrations. The last three were referenced by the app code, but I did not find matching migrations in this repository until I added `20250409000000_missing_app_tables.sql`. Apply that migration too so the home page, AI memory, and question counter features work in the new database.

## Important behavior

- Admin and doctor role checks are currently email-domain based in `src/lib/auth.ts`.
- The root `.env` is loaded by `server/server.js`.
- The browser client reads the `VITE_*` values through `src/lib/supabase.ts`.
