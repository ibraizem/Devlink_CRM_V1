# Clerk Authentication Integration

This project now includes full Clerk authentication support integrated with Supabase.

## 🚀 Quick Start

**Get up and running in 15 minutes:**
→ [QUICKSTART Guide](./lib/utils/supabase/migrations/QUICKSTART.md)

## 📚 Documentation

### For Developers
- **[Quickstart Guide](./lib/utils/supabase/migrations/QUICKSTART.md)** - 15-minute setup
- **[Code Examples](./lib/utils/supabase/migrations/EXAMPLES.md)** - Server/Client components, API routes, etc.
- **[TypeScript Helpers](./lib/utils/clerk-supabase-helpers.ts)** - Utility functions

### For DevOps/Admins
- **[Complete Migration Guide](./lib/utils/supabase/migrations/README_CLERK_MIGRATION.md)** - Full deployment guide
- **[Migration Summary](./lib/utils/supabase/migrations/MIGRATION_SUMMARY.md)** - What was implemented

### Reference
- **[Index](./lib/utils/supabase/migrations/INDEX.md)** - Complete file index and navigation

## 📁 What's Included

### Database Migrations (7 files)
Located in `lib/utils/supabase/migrations/`:
1. `20250115000000_add_clerk_user_id.sql` - Schema changes
2. `20250115000001_clerk_helper_functions.sql` - SQL helpers
3. `20250115000002_update_rls_policies_for_clerk.sql` - Main tables
4. `20250115000003_update_other_tables_rls.sql` - File tables
5. `20250115000004_clerk_webhook_handler.sql` - Webhook handler
6. `20250115000005_map_existing_users.sql` - Migration helpers
7. `20250115000006_storage_policies_clerk.sql` - Storage policies

### Application Code
- `lib/utils/clerk-supabase-helpers.ts` - TypeScript utilities
- `app/api/webhooks/clerk/route.ts` - Webhook endpoint
- `.env.example` - Environment variables template

### Documentation
- `QUICKSTART.md` - Fast setup guide
- `README_CLERK_MIGRATION.md` - Complete guide
- `EXAMPLES.md` - Code examples
- `MIGRATION_SUMMARY.md` - Implementation summary
- `INDEX.md` - File index

## ✨ Features

- ✅ **Dual Authentication** - Works with Supabase Auth and Clerk
- ✅ **Row Level Security** - All RLS policies updated
- ✅ **Role-Based Access** - Admin, Manager, Telepro roles
- ✅ **Webhook Sync** - Automatic user profile sync
- ✅ **TypeScript Helpers** - Type-safe utilities
- ✅ **Real-time Support** - Maintained Supabase real-time
- ✅ **Migration Tools** - Helper functions for existing users

## 🎯 Usage Examples

### Server Component
```typescript
import { auth } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/lib/utils/clerk-supabase-helpers'

export default async function Page() {
  const { getToken } = auth()
  const token = await getToken({ template: 'supabase' })
  
  const supabase = createClerkSupabaseClient(token!, url, key)
  const { data: leads } = await supabase.from('leads').select('*')
  
  return <LeadsList leads={leads} />
}
```

### Check User Role
```typescript
import { hasRole } from '@/lib/utils/clerk-supabase-helpers'

if (await hasRole(supabase, 'admin')) {
  // Show admin features
}
```

### Server Action
```typescript
'use server'
import { auth } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/lib/utils/clerk-supabase-helpers'

export async function updateLead(id: string, data: any) {
  const { getToken } = auth()
  const token = await getToken({ template: 'supabase' })
  const supabase = createClerkSupabaseClient(token!, url, key)
  
  return await supabase.from('leads').update(data).eq('id', id)
}
```

## 🔧 Setup Steps

### 0. Install Dependencies (First!)

**IMPORTANT:** Install required packages before setup:

```bash
yarn add @clerk/nextjs svix
```

Or with npm:
```bash
npm install @clerk/nextjs svix
```

### Setup Process

1. **Run database migrations** (5 min)
2. **Configure Clerk JWT template** (3 min)
3. **Set environment variables** (2 min)
4. **Set up webhook** (3 min)
5. **Test authentication** (2 min)

**Total:** ~15 minutes

See [QUICKSTART.md](./lib/utils/supabase/migrations/QUICKSTART.md) for detailed instructions.

## 🔑 Environment Variables

Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

## 📊 Database Schema

### New Column
- `users_profile.clerk_user_id` (text, unique)

### New Functions (16)
- `get_clerk_user_id()`
- `is_clerk_authenticated()`
- `get_current_user_profile()`
- `current_user_has_role()`
- `sync_clerk_user()`
- And 11 more...

### Updated Policies
- 10 tables with updated RLS policies
- 2 storage buckets with updated policies
- All policies support dual authentication

## 🛡️ Security

- JWT signature verification
- Row Level Security enforced
- Role-based access control
- Webhook signature verification
- Service role key protection

## 🧪 Testing

### Test Authentication
```sql
-- In Supabase SQL Editor
SELECT get_clerk_user_id();
SELECT is_clerk_authenticated();
SELECT * FROM get_current_user_profile();
```

### Test RLS Policies
Sign in via Clerk and fetch data - RLS will automatically filter to your data.

## 🚨 Important Notes

1. Migrations must be run in order
2. JWT template name must be "supabase"
3. Webhook endpoint must be publicly accessible
4. Always test in development first

## 📞 Need Help?

1. **Quick setup:** [QUICKSTART.md](./lib/utils/supabase/migrations/QUICKSTART.md)
2. **Examples:** [EXAMPLES.md](./lib/utils/supabase/migrations/EXAMPLES.md)
3. **Full guide:** [README_CLERK_MIGRATION.md](./lib/utils/supabase/migrations/README_CLERK_MIGRATION.md)
4. **Index:** [INDEX.md](./lib/utils/supabase/migrations/INDEX.md)

## 📈 What's Next?

After setup:
- [ ] Protect your routes with middleware
- [ ] Set user roles in Clerk metadata
- [ ] Migrate existing Supabase Auth users (if any)
- [ ] Customize JWT claims as needed
- [ ] Monitor webhook logs

## 🎓 Learn More

- **Clerk Documentation:** https://clerk.com/docs
- **Supabase Documentation:** https://supabase.com/docs
- **Next.js App Router:** https://nextjs.org/docs

---

**Ready to start?** → [QUICKSTART Guide](./lib/utils/supabase/migrations/QUICKSTART.md)
