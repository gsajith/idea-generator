# idea-generator

A personal site that listens to places where consumers talk, distills what they say into needs, and turns those needs into product ideas sized for one builder. See `GLOSSARY.md` for the vocabulary.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill it in.
3. `npm run db:migrate` to create the tables.
4. `npm run dev` and sign in with an email from `ALLOWED_EMAILS`.
5. To run a tick by hand: `curl -X POST -H "Authorization: Bearer $TICK_SECRET" localhost:3000/api/tick`.

## Scheduling

`.github/workflows/tick.yml` calls `POST /api/tick` every hour, which fetches every source that is due. Set the `APP_URL` and `TICK_SECRET` repository secrets on GitHub, and the same `TICK_SECRET` on Vercel.

## Checks

- `npm run typecheck`
- `npm run lint`
- `npm test` runs against an in-memory Postgres, with no API calls.
