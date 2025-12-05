# DevLink CRM

CRM de téléprospection avec gestion complète des leads, rendez-vous, et fichiers.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Clerk credentials

# Run development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication

This project supports **Clerk authentication** integrated with Supabase.

**→ [Clerk Migration Guide](./CLERK_MIGRATION.md)** - Complete setup guide

### Required Packages

**Install before setup:**
```bash
yarn add @clerk/nextjs svix
```

### Quick Setup (15 minutes)
1. Install required packages (above)
2. Run database migrations
3. Configure Clerk JWT template
4. Set environment variables
5. Set up webhooks
6. Test authentication

See [QUICKSTART.md](./lib/utils/supabase/migrations/QUICKSTART.md) for detailed steps.

## 📚 Tech Stack

- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript
- **Authentication:** Clerk
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand, React Query, Context API
- **Forms:** React Hook Form + Zod
- **Animation:** Framer Motion

## 📖 Documentation

### For Developers
- [AGENTS.md](./AGENTS.md) - Tech stack and architecture guide
- [Clerk Migration Guide](./CLERK_MIGRATION.md) - Authentication setup
- [Code Examples](./lib/utils/supabase/migrations/EXAMPLES.md) - Usage examples
- [Database Schema](./DATABASE_SCHEMA.md) - Database structure

### Authentication Docs
- [Quick Start](./lib/utils/supabase/migrations/QUICKSTART.md) - 15-min setup
- [Migration Guide](./lib/utils/supabase/migrations/README_CLERK_MIGRATION.md) - Complete guide
- [Examples](./lib/utils/supabase/migrations/EXAMPLES.md) - Code samples
- [Index](./lib/utils/supabase/migrations/INDEX.md) - All files

## 🛠️ Commands

```bash
# Development
yarn dev          # Start dev server

# Build
yarn build        # Build for production

# Quality
yarn lint         # Run ESLint
yarn typecheck    # Run TypeScript checks
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── leads/             # Leads management
│   ├── fichiers/          # File management
│   ├── rendezvous/        # Appointments
│   └── api/               # API routes
├── components/            # React components
│   ├── auth/              # Auth components
│   ├── leads/             # Lead components
│   ├── fichiers/          # File components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilities
│   ├── services/          # Business logic
│   ├── types/             # TypeScript types
│   └── utils/             # Helper functions
│       ├── clerk-supabase-helpers.ts  # Clerk utilities
│       └── supabase/      # Supabase config
│           └── migrations/  # Database migrations
└── public/                # Static assets
```

## 🔑 Environment Variables

Required variables (see `.env.example`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
```

## 🎯 Features

### Lead Management
- Import leads from CSV/Excel files
- Assign leads to agents
- Track lead status and history
- Add notes and attachments
- Real-time updates

### Authentication & Authorization
- Clerk authentication
- Role-based access (Admin, Manager, Telepro)
- Row Level Security (RLS)
- Automatic user sync via webhooks

### File Management
- Upload and process CSV/Excel files
- Preview file data
- Track file metadata
- Manage custom columns

### Appointments
- Schedule appointments with leads
- Calendar integration
- Status tracking
- Notifications

### Communication
- Call tracking
- Email integration
- WhatsApp messaging
- SMS sending
- Activity timeline

## 🧪 Testing

### Test Authentication
```typescript
import { auth } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/lib/utils/clerk-supabase-helpers'

const { getToken } = auth()
const token = await getToken({ template: 'supabase' })
const supabase = createClerkSupabaseClient(token!, url, key)
```

### Test RLS Policies
```sql
-- In Supabase SQL Editor
SELECT get_clerk_user_id();
SELECT * FROM get_current_user_profile();
```

## 🚨 Important Notes

1. **Database Migrations:** Must be run in order
2. **JWT Template:** Must be named "supabase" in Clerk
3. **Webhooks:** Must be publicly accessible
4. **Environment:** Always test in development first

## 📞 Support

- **Authentication Setup:** [CLERK_MIGRATION.md](./CLERK_MIGRATION.md)
- **Quick Start:** [QUICKSTART.md](./lib/utils/supabase/migrations/QUICKSTART.md)
- **Examples:** [EXAMPLES.md](./lib/utils/supabase/migrations/EXAMPLES.md)
- **Clerk Docs:** https://clerk.com/docs
- **Supabase Docs:** https://supabase.com/docs

## 📝 License

Private project - All rights reserved
