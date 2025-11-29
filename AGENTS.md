# DevLink CRM - Agent Guide

## Commands
- **Setup**: `yarn install` (uses Yarn per yarn.lock)
- **Dev server**: `yarn dev` (runs on http://localhost:3000)
- **Build**: `yarn build`
- **Lint**: `yarn lint`
- **Type check**: `yarn typecheck`
- **Format**: `yarn format`

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (auth + database)
- **State**: Zustand, TanStack Query
- **UI**: Radix UI primitives, Framer Motion, Lucide icons

## Architecture
- **App Router** structure in `/app` (leads, fichiers, dashboard, etc.)
- **Components** in `/components` (UI, feature-specific modules)
- **Path aliases**: `@/*` maps to root (e.g., `@/lib`, `@/components`, `@/types`)
- **Client components**: Use `"use client"` directive for interactive features

## Code Style
- ESLint: Next.js core web vitals config
- Prettier with Tailwind plugin for formatting
- Component-based architecture with composition patterns
