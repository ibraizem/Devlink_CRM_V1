# AGENTS.md

## Commands

**Setup:** `yarn install`  
**Dev Server:** `yarn dev`  
**Build:** `yarn build`  
**Lint:** `yarn lint`  
**Tests:** N/A (no test framework configured)  
**Type Check:** `yarn typecheck`

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with shadcn/ui components
- **State:** Zustand, React Query (@tanstack/react-query)
- **Backend:** Supabase (auth & database)
- **Forms:** react-hook-form with Zod validation
- **UI:** Radix UI primitives, Framer Motion, Lucide icons

## Architecture

App Router structure with feature-based organization: `/app` for routes, `/components` for UI (organized by feature), `/lib` for utilities, `/hooks` for custom hooks, `/contexts` for React context, `/types` for TypeScript definitions. Uses `@/` path alias for imports.

## Code Conventions

- Use `cn()` utility from `lib/utils.ts` for conditional classes
- Functional components with TypeScript interfaces
- French locale for dates/times (`fr-FR`)
- shadcn/ui component patterns with Radix UI primitives
