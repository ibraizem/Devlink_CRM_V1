# AGENTS.md

## Commands
- **Setup**: `yarn install` (uses Yarn, see yarn.lock)
- **Dev**: `yarn dev` (starts Next.js dev server on http://localhost:3000)
- **Build**: `yarn build`
- **Lint**: `yarn lint`
- **Test**: No test framework configured
- **Typecheck**: `yarn typecheck`

## Tech Stack
- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components (Radix UI primitives)
- **Backend**: Supabase (SSR + Auth)
- **State**: Zustand, React Query, Context API
- **Forms**: React Hook Form + Zod validation

## Architecture
- `/app`: Next.js app router pages (auth, dashboard, leads, fichiers, etc.)
- `/components`: Organized by feature (ui, leads, fichiers, auth, common, landing)
- `/lib`, `/hooks`, `/contexts`, `/types`: Shared utilities and logic
- Path alias: `@/*` maps to repo root

## Code Style
- Use `cn()` utility from `@/lib/types/utils` for conditional classes
- Component pattern: `React.forwardRef` for UI primitives with typed props
- Class-variance-authority (cva) for variant-based component styling
- No semicolons, single quotes in JSX, Prettier formatted
