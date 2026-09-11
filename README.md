# Family Tree

A personal ancestor pedigree chart. Start from one root person and browse their
parents, grandparents, and so on — no siblings, no descendants, just the
direct ancestral line.

## Features

- Pedigree chart showing 5 generations at a time (root + 4 back)
- Click any node to edit full name, birth year, birthplace, and notes in a popover
- Unfilled ancestors render as blank "?" placeholders — the tree doesn't need to be complete
- Click "Make root ancestor" on any node to re-center the view on that person and browse further back, with a Back button to return
- Synced to your account via Supabase, so the tree is accessible from any device

## Stack

- React + TypeScript, built with Vite
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth) — no custom backend server

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create a [Supabase](https://supabase.com) project, then copy `.env.example` to `.env` and fill in the project URL and publishable/anon key from **Project Settings → Data API**.
3. Run `supabase-schema.sql` in the Supabase SQL Editor to create the `people` table and its row-level security policies.
4. Start the dev server:
   ```
   npm run dev
   ```

## Data model

Each person is stored with an integer `slot` using
[Ahnentafel numbering](https://en.wikipedia.org/wiki/Ahnentafel): the root
person is slot 1, and for any person at slot `n`, their father is at `2n` and
their mother at `2n + 1`. This single number encodes generation, lineage, and
position, and it's also what makes re-rooting the view onto any ancestor a
simple calculation rather than a data migration.
