# idea-generator

A personal site that fetches signals from sources, distills them into needs, and turns needs into ideas. Vocabulary lives in `GLOSSARY.md`; the v1 spec is issue #3.

## Working in this repo

- Next.js 16 has breaking changes from older versions (Proxy instead of Middleware, typed `LayoutProps`, and more). Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.
- Checks: `npm run typecheck`, `npm run lint`, `npm test`.
- Schema changes: edit `src/db/schema.ts`, then `npm run db:generate` to write a migration. A test fails if a table or column in the schema has no migration.
- Every model call goes through the `Model` interface in `src/model/model.ts`. Tests use `createFakeModel`; nothing in tests calls the real API.
- Tests run against an in-memory Postgres from `createTestDb()`, not mocks.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on gsajith/idea-generator, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The default five labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root, created as needed. See `docs/agents/domain.md`.
