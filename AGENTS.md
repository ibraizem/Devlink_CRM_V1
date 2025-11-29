# DevLink CRM - Agent Guide

## Commands
- **Setup**: `yarn install` (uses Yarn per yarn.lock)
- **Dev server**: `yarn dev` (runs on http://localhost:3000)
- **Build**: `yarn build`
- **Lint**: `yarn lint`
- **Type check**: `yarn typecheck`
- **Format**: `yarn format`

## Tech Stack
- **Framework**: Next.js 14 (App Router) with React 18
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (auth + database via @supabase/ssr)
- **State**: Zustand, TanStack Query (@tanstack/react-query)
- **UI**: Radix UI primitives, Framer Motion, Lucide icons

## Architecture
- **App Router** structure in `/app` with route-based folders (auth, dashboard, leads, fichiers, etc.)
- **Components** in `/components` (ui/, common/, feature-specific folders)
- **Path aliases**: `@/*` maps to root (e.g., `@/lib`, `@/components`, `@/types`)
- **Client components**: Use `"use client"` directive for interactive features

## Code Style
- ESLint: Next.js core web vitals config
- Prettier with Tailwind plugin for formatting
- Component-based architecture with composition patterns
- Use `cn()` utility from `@/lib/utils` for className merging (clsx + tailwind-merge)
- TypeScript with strict mode enabled
- French locale for dates/UI (fr-FR)
- shadcn/ui patterns: forwardRef for components, CVA for variants
