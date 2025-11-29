# DevLink CRM - Agent Guide

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
- **Animation**: Framer Motion
- **Data Handling**: XLSX, PapaParse for file processing
- **Tables**: TanStack Table + TanStack Virtual

## Architecture

### App Router Structure
- `/app/auth/*` - Authentication pages (login, register, forgot-password, update-password)
- `/app/dashboard` - Main dashboard with stats
- `/app/leads` - Leads management
- `/app/fichiers` - File upload and management
- `/app/rendezvous` - Appointments
- `/app/rapports` - Reports
- `/app/settings` - User settings
- `/app/compte` - Account management
- Path alias: `@/*` maps to repo root

### Component Organization
- `/components/auth/` - AuthCard with animations
- `/components/leads/` - 20+ lead management components
- `/components/fichiers/` - File management
- `/components/landing/` - Landing page sections
- `/components/ui/` - shadcn/ui primitives
- `/components/Sidebar.tsx` - Navigation

## Supabase SSR Authentication Flow

### Three Client Types

1. **Browser Client** (`lib/utils/supabase/client.ts`) - Uses `createBrowserClient` for Client Components
2. **Server Client** (`lib/utils/supabase/server.ts`) - Uses `createServerClient` with cookies for Server Components
3. **Middleware Client** (`lib/utils/supabase/middleware.ts`) - Refreshes sessions (no root middleware.ts exists)

### Auth Functions (`lib/types/auth.ts`)
- `signIn(email, password)` - Password authentication
- `signUp(email, password, nom, prenom, role)` - Creates user + profile
- `signOut()` - Clears session
- `getCurrentUser()` - Gets current user
- `getUserProfile(userId)` - Gets profile with role

### Route Protection
Client-side checks in each protected page:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) router.push('/auth/login')
```

## Key Reusable Components

### AuthCard (`components/auth/AuthCard.tsx`)
Reusable auth wrapper with Framer Motion animations.

**Props**: title, subtitle, children, footer, highlightText

**Features**:
- Split layout (form left, illustration right)
- AnimatePresence transitions
- Loading skeleton for SSR safety
- Gradient background

**Animations**:
- Form: `initial={{ opacity: 0, x: -20 }}`
- Illustration: `initial={{ opacity: 0 }}` with delay
- Errors: Slide down animation

### Sidebar (`components/Sidebar.tsx`)
Collapsible navigation with animations.

**Features**:
- localStorage persistence
- Mobile overlay
- Active route highlighting with `layoutId`
- Spring physics transitions

**Menu Items**:
- Dashboard, Leads, Fichiers, Rendez-vous, Rapports

## Framer Motion Animation System

### Global Patterns
- **Page Entrance**: `{ opacity: 0, x: -20 }` to `{ opacity: 1, x: 0 }`
- **Staggered Lists**: Container with `staggerChildren: 0.1`
- **Interactive**: `whileHover={{ scale: 1.05 }}`, `whileTap={{ scale: 0.95 }}`
- **Shared Elements**: `layoutId` for smooth transitions

### Landing Page Animations
- **Navbar**: Scroll-triggered opacity, mobile menu slide-in
- **Hero**: Title fade up, CTA stagger, dashboard preview slide up
- **Features**: Tab switching, staggered cards
- **Pricing**: Staggered plans, animated checkmarks
- **Footer**: Fade in on scroll, icon hover effects

## Leads Management System

### Core Hook: `useCrmData2`
Main data hook that:
- Fetches files from `fichiers_import`
- Parses CSV/Excel files
- Adds metadata (`_fileId`, `_fileName`, `_filePath`)
- Manages pagination and selection

### Lead Service (`lib/services/leadService.ts`)
Methods:
- `deleteLead(leadId)`
- `getLeadsFromFiles(fileIds, options)`
- `updateLeadStatus(leadId, status)` - Statuses: nouveau, en_cours, traite, abandonne
- `addNoteToLead(leadId, note)`
- `getLeadStats(fileIds)`
- `updateLeadData(leadId, updates)`
- `exportLeadsToCsv(fileIds, columns)`

### RawLeadsTable (`components/leads/RawLeadsTable.tsx`)
Main table with:
- Dynamic column visibility (min 3)
- Search and filtering
- Bulk selection
- Row actions (call, note, edit, delete)
- Pagination
- CSV export

**Sub-components**:
- LeadsTableToolbar - Search, refresh, column selector, export
- LeadsTableHeader - Sortable headers
- LeadsTableRow - Checkbox and actions
- LeadsTableActionsMenu - Dropdown menu
- ColumnSelector - Multi-select columns
- NoteModal - Add notes
- EditLeadDrawer - Edit details

### Filtering and Bulk Operations

**Client-Side Filtering**:
- Search across all fields
- Filter by status
- Real-time updates

**Bulk Selection**:
- Checkbox selection with Set
- Export selected to CSV
- Delete with confirmation

## Communication Features

### CommunicationPanel (`components/leads/CommunicationPanel.tsx`)
Multi-channel communication:
- Appel (call via VOIP)
- Email
- WhatsApp
- SMS

### ActivityTimeline (`components/leads/ActivityTimeline.tsx`)
Shows communication history with icons and timestamps.

## Campaign Execution Capabilities

The CRM header (`components/CrmHeader.tsx`) includes campaign views:
- View switching: leads, campaigns, analytics
- Campaign execution tracked via communication panel
- Activity timeline shows campaign interactions

## Integration Ecosystem

### Supported Integrations

**Email**:
- Gmail (via communication panel)
- Outlook (via communication panel)

**Social/Professional**:
- LinkedIn (contact form in landing page)
- WhatsApp (communication type in CommunicationPanel)

**Automation**:
- Zapier (mentioned in contact/integration sections)
- Make (mentioned in contact/integration sections)

**Communication**:
- WhatsApp messaging
- SMS sending
- VOIP calls via `useCall` hook

### Integration Architecture
Communication channels are abstracted through:
1. `CommunicationPanel` component - UI for all channels
2. `useCall` hook - VOIP integration
3. Activity tracking in `ActivityTimeline`

Icons and references to these integrations appear in:
- Landing page Contact section
- Communication panel
- Activity timeline

## File Management System

### Upload Flow (`app/fichiers/page.tsx`)
1. Drag-drop or click to upload (FileUploader component)
2. Parse CSV/Excel files
3. Store in Supabase Storage
4. Save metadata to `fichiers_import` table
5. Track line counts and status

### File Operations
- Upload with progress tracking
- Preview with FilePreviewModal (first 50 rows)
- Edit filename
- Download original file
- Delete with confirmation
- Toggle active/inactive status

### File Selection (`components/fichiers/FichierSelecteur.tsx`)
- Multi-select files
- Show line counts
- Filter by status
- Load data into leads table

## Code Style
- No semicolons
- Single quotes in JSX
- Prettier formatted
- Use `cn()` for conditional classes
- Class-variance-authority for variants
- React.forwardRef for UI primitives

## Database Schema
See DATABASE_SCHEMA.md for:
- `users_profile` - User profiles with roles
- `fichiers_import` - File metadata
- `fichier_donnees` - Lead data
- Lead statuses and relationships
