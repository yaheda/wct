# Repository Guidelines
 
## Project Structure & Module Organization
- Source: `src/` with `app/` (routes, `layout.tsx`, `page.tsx`), `components/` (UI + app components), and `lib/` (utilities, DB helpers).
- API routes: `src/app/api/**/route.ts`.
- Styling: `src/app/globals.css` (Tailwind).
- Database: Prisma schema in `prisma/schema.prisma`; migrations in `prisma/migrations/`.
- Static assets: `public/`.
 
## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server on port 3005 (Turbopack).
- `npm run build`: Production build.
- `npm start`: Serve production build.
- `npm run lint`: Run ESLint.
- Database (examples): `npx prisma migrate dev`, `npx prisma generate`, `npx prisma studio`.
 
## Coding Style & Naming Conventions
- Language: TypeScript, 2‑space indent, semicolons optional per ESLint config.
- Components: PascalCase React components in `src/components/*.tsx` and `src/components/ui/*.tsx`.
- Routes: App Router with folder segments; use `route.ts` for API handlers and `page.tsx` for pages.
- Utilities: CamelCase functions in `src/lib/*.ts`.
- Linting: ESLint with `eslint-config-next`. Run `npm run lint` before PRs.
- Styling: Tailwind CSS (classes in JSX). Prefer existing `ui/*` primitives.
 
## Testing Guidelines
- No test framework is configured yet. If adding tests, prefer:
  - Unit: Vitest or Jest with files named `*.test.ts(x)` colocated under `src/`.
  - E2E: Playwright with tests under `e2e/`.
- Aim for critical-path coverage (API routes, lib functions). Keep tests deterministic.
 
## Commit & Pull Request Guidelines
- Commits: Imperative, concise subject (≤72 chars), descriptive body when needed. Example: "Add custom page validation to AddCompetitorForm".
- Branches: `feature/short-description` or `fix/area-summary`.
- PRs: Clear description, link issues (`#123`), include screenshots for UI changes and relevant console/server logs for API changes. Ensure `npm run lint` passes.
 
## Security & Configuration Tips
- Secrets: Use `.env.local` for local secrets; avoid committing real credentials. Required envs include `DATABASE_URL`, `DIRECT_URL`, and Clerk keys when enabled.
- DB changes: Update `prisma/schema.prisma` then run `npx prisma migrate dev`.
