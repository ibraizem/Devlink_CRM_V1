# Lead Detail View Integration Guide

This guide shows how to integrate the lead detail view with existing components.

## Navigation to Lead Detail

### From Lead Table Row

To make table rows clickable and navigate to detail view:

```tsx
import { useRouter } from 'next/navigation';

function LeadTable() {
  const router = useRouter();

  const handleRowClick = (leadId: string) => {
    router.push(`/dashboard/leads/${leadId}`);
  };

  return (
    <TableRow onClick={() => handleRowClick(lead.id)}>
      {/* row content */}
    </TableRow>
  );
}
```

### From Lead Cards

```tsx
import Link from 'next/link';

function LeadCard({ lead }) {
  return (
    <Link href={`/dashboard/leads/${lead.id}`}>
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        {/* card content */}
      </Card>
    </Link>
  );
}
```

### From Actions Menu

Update `LeadsTableActionsMenu.tsx`:

```tsx
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';

export function LeadsTableActionsMenu({ leadId, ...props }) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => router.push(`/dashboard/leads/${leadId}`)}>
          <Eye className="mr-2 h-4 w-4" />
          Voir détails
        </DropdownMenuItem>
        {/* other actions */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Programmatic Navigation

### After Creating a Lead

```tsx
import { createLead } from '@/lib/types/leads';
import { useRouter } from 'next/navigation';

async function handleCreateLead(leadData) {
  const { data, error } = await createLead(leadData);
  
  if (data && !error) {
    toast.success('Lead créé avec succès');
    router.push(`/dashboard/leads/${data.id}`);
  }
}
```

### From Search Results

```tsx
function SearchResults({ results }) {
  return (
    <div>
      {results.map(lead => (
        <Link 
          key={lead.id} 
          href={`/dashboard/leads/${lead.id}`}
          className="block p-4 hover:bg-gray-50"
        >
          <h3>{lead.nom} {lead.prenom}</h3>
          <p className="text-sm text-gray-500">{lead.email}</p>
        </Link>
      ))}
    </div>
  );
}
```

## Back Navigation

The lead detail view includes a back button that returns to `/dashboard/leads`. To customize:

```tsx
// In LeadDetailView.tsx, modify the back button:
<Button
  variant="outline"
  size="icon"
  onClick={() => router.back()} // or router.push('/your-custom-route')
>
  <ArrowLeft className="h-4 w-4" />
</Button>
```

## Deep Linking

### Link to Specific Tab

```tsx
// Future enhancement - add tab param
<Link href={`/dashboard/leads/${leadId}?tab=notes`}>
  View Notes
</Link>

// Then in page.tsx:
import { useSearchParams } from 'next/navigation';

export default function LeadDetailPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'timeline';
  
  return <LeadDetailView lead={lead} defaultTab={defaultTab} />;
}
```

### Link to Communication Action

```tsx
// Example: Direct link to log a call
<Link href={`/dashboard/leads/${leadId}?action=call`}>
  Log Call
</Link>
```

## Embedding in Dashboard

### As a Modal/Drawer

Instead of a full page, you can show lead details in a drawer:

```tsx
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { LeadDetailView } from '@/components/leads/LeadDetailView';

function DashboardWithLeadDetail() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  
  return (
    <>
      <LeadList onSelectLead={setSelectedLeadId} />
      
      <Sheet open={!!selectedLeadId} onOpenChange={() => setSelectedLeadId(null)}>
        <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
          {selectedLeadId && (
            <LeadDetailView 
              lead={lead} 
              onUpdate={() => {/* refresh */}}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
```

## Sidebar Navigation

Add to dashboard sidebar:

```tsx
// In sidebar navigation component
import { Users, User } from 'lucide-react';

const navigation = [
  { name: 'Leads', href: '/dashboard/leads', icon: Users },
  // When viewing a lead, show active state
  { 
    name: 'Lead Detail', 
    href: `/dashboard/leads/${currentLeadId}`, 
    icon: User,
    active: pathname.includes('/dashboard/leads/')
  },
];
```

## Breadcrumbs

Show navigation breadcrumbs:

```tsx
import { Breadcrumb } from '@/components/ui/breadcrumb';

function LeadDetailPage() {
  return (
    <div>
      <Breadcrumb>
        <BreadcrumbItem>
          <Link href="/dashboard">Dashboard</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <Link href="/dashboard/leads">Leads</Link>
        </BreadcrumbItem>
        <BreadcrumbItem active>
          {lead.nom} {lead.prenom}
        </BreadcrumbItem>
      </Breadcrumb>
      
      <LeadDetailView lead={lead} onUpdate={loadLead} />
    </div>
  );
}
```

## Mobile Navigation

For mobile, consider a bottom sheet:

```tsx
import { Drawer } from 'vaul';

function MobileLeadDetail() {
  return (
    <Drawer.Root>
      <Drawer.Trigger>View Lead</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay />
        <Drawer.Content>
          <LeadDetailView lead={lead} onUpdate={loadLead} />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

## Context Menu Integration

Add "View Details" to right-click menu:

```tsx
import { ContextMenu } from '@/components/ui/context-menu';

function LeadTableRow({ lead }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <TableRow>
          {/* row content */}
        </TableRow>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => router.push(`/dashboard/leads/${lead.id}`)}>
          View Details
        </ContextMenuItem>
        <ContextMenuItem>Edit</ContextMenuItem>
        <ContextMenuItem>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

## Keyboard Shortcuts

Add keyboard navigation:

```tsx
import { useEffect } from 'react';

function LeadTable() {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Press Enter to view details
      if (e.key === 'Enter' && selectedLead) {
        router.push(`/dashboard/leads/${selectedLead.id}`);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedLead]);
}
```

## URL State Management

Keep filters when navigating back:

```tsx
function LeadList() {
  const [filters, setFilters] = useState({});
  
  const handleViewDetails = (leadId: string) => {
    // Save filters to session storage
    sessionStorage.setItem('leadFilters', JSON.stringify(filters));
    router.push(`/dashboard/leads/${leadId}`);
  };
  
  useEffect(() => {
    // Restore filters when coming back
    const savedFilters = sessionStorage.getItem('leadFilters');
    if (savedFilters) {
      setFilters(JSON.parse(savedFilters));
    }
  }, []);
}
```

## Complete Example

Here's a complete example integrating everything:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lead } from '@/lib/types/leads';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';

export function LeadCard({ lead }: { lead: Lead }) {
  const router = useRouter();

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">
          {lead.nom} {lead.prenom}
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Voir
        </Button>
      </div>
      
      <div className="space-y-1 text-sm text-gray-600">
        <p>{lead.email}</p>
        <p>{lead.telephone}</p>
      </div>
      
      {/* Alternative: Make entire card clickable */}
      <Link 
        href={`/dashboard/leads/${lead.id}`}
        className="absolute inset-0"
        aria-label={`View details for ${lead.nom} ${lead.prenom}`}
      />
    </div>
  );
}
```
