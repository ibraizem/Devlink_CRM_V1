# Lead Detail View Feature Documentation

## Overview

This feature provides a comprehensive lead detail view with full CRUD operations, activity timeline, notes management, attachments support, status change history, and integration with communication channels (email, phone, WhatsApp, SMS).

## Features Implemented

### 1. Lead Detail View
- **Route**: `/dashboard/leads/[id]`
- Full lead information display
- Edit and delete functionality
- Responsive layout with sidebar for quick actions

### 2. Lead Information Card (`LeadInfoCard.tsx`)
- Display all lead contact information (email, phone, address)
- Assigned agent information
- Company details
- Status badge with inline editing via dropdown
- Creation date
- Custom fields display
- Real-time status updates

### 3. Activity Timeline (`ActivityTimeline.tsx`)
- Chronological view of all lead activities
- Different icons and colors for each activity type:
  - 📝 Note (blue)
  - 📈 Status Change (green)
  - 👤 Lead Assignment (purple)
  - 📞 Phone Call (orange)
  - 📧 Email (red)
  - 💬 WhatsApp (green)
  - 💬 SMS (blue)
  - 📅 Meeting (yellow)
- Shows agent who performed the action
- Timestamps with relative dates
- Metadata display (call duration, status changes, etc.)

### 4. Notes Management (`NotesSection.tsx`)
- Create new notes with rich text input
- Edit existing notes inline
- Delete notes with confirmation dialog
- Shows author and timestamp
- Real-time updates
- Markdown support ready

### 5. Attachments Management (`AttachmentsSection.tsx`)
- Upload files (max 10 MB)
- Supported file types: all
- File preview links
- Download files
- Delete attachments with confirmation
- Shows file size, upload date, and uploader
- Uses Supabase Storage

### 6. Status History (`StatusHistorySection.tsx`)
- Timeline of all status changes
- Shows old status → new status transitions
- Visual status indicators with colors
- Agent who made the change
- Timestamps

### 7. Communication Panel (`CommunicationPanel.tsx`)
- **Phone**: Log phone calls with duration and notes
- **Email**: Track email communications
- **WhatsApp**: Direct link to WhatsApp Web + activity logging
- **SMS**: Direct link to SMS app + activity logging
- Quick access to contact information
- Click-to-call/email/message functionality
- Communication history logging

### 8. Edit Lead Dialog (`LeadEditDialog.tsx`)
- Inline editing of lead information
- Fields:
  - Name and surname
  - Email and phone
  - Address
  - Company
  - Assigned agent (dropdown)
  - Notes
- Form validation
- Success/error notifications

## File Structure

```
app/
  dashboard/
    leads/
      [id]/
        page.tsx          # Lead detail page route

components/
  leads/
    LeadDetailView.tsx           # Main detail view container
    LeadInfoCard.tsx             # Lead information display
    ActivityTimeline.tsx         # Activity timeline
    NotesSection.tsx             # Notes management
    AttachmentsSection.tsx       # File attachments
    StatusHistorySection.tsx     # Status change history
    CommunicationPanel.tsx       # Communication actions
    LeadEditDialog.tsx           # Edit lead dialog

lib/
  types/
    leads.ts                     # Lead types and API functions
```

## API Functions Added

All functions are in `lib/types/leads.ts`:

### Lead Management
- `getLeadById(id: string)` - Fetch single lead with relations
- `updateLead(id: string, updates: Partial<Lead>)` - Update lead
- `deleteLead(id: string)` - Delete lead

### Notes
- `getLeadNotes(leadId: string)` - Fetch all notes
- `createNote(leadId: string, contenu: string)` - Create note
- `updateNote(noteId: string, contenu: string)` - Update note
- `deleteNote(noteId: string)` - Delete note

### Attachments
- `getLeadAttachments(leadId: string)` - Fetch all attachments
- `uploadAttachment(leadId: string, file: File)` - Upload file
- `deleteAttachment(attachmentId: string, leadId: string)` - Delete file

### Activity & History
- `getLeadHistory(leadId: string)` - Fetch activity timeline
- `getStatusHistory(leadId: string)` - Fetch status changes only
- `logCommunication(leadId, type, description, metadata)` - Log communication

### Other
- `getAgents()` - Fetch all active agents for assignment

## Usage

### Navigation to Lead Detail
From any lead list, click on a lead or navigate to:
```
/dashboard/leads/[leadId]
```

### Quick Actions
- **Edit**: Click edit icon in header
- **Delete**: Click delete icon (with confirmation)
- **Status Change**: Use dropdown in info card
- **Call/Email/WhatsApp/SMS**: Use buttons in communication panel

### Adding Notes
1. Go to "Notes" tab
2. Type note in textarea
3. Click "Ajouter une note"

### Uploading Files
1. Go to "Pièces jointes" tab
2. Click "Choisir un fichier"
3. Select file (max 10 MB)
4. File uploads automatically

### Logging Communication
1. Click communication button (Phone, Email, WhatsApp, SMS)
2. Fill in details (duration, notes, result)
3. Click "Enregistrer"

## Database Requirements

See `DATABASE_SCHEMA.md` for complete database setup instructions.

Required:
- `leads` table (existing)
- `notes` table (existing)
- `historique_actions` table (existing)
- `lead_attachments` table (NEW - needs creation)
- `lead-attachments` storage bucket (NEW - needs creation)

## Styling

Uses:
- Tailwind CSS for styling
- shadcn/ui components
- Responsive design
- Dark mode support
- Consistent color scheme

## Dependencies

All dependencies are already in package.json:
- `date-fns` - Date formatting
- `sonner` - Toast notifications
- `lucide-react` - Icons
- `@radix-ui/*` - UI primitives
- `@supabase/ssr` - Supabase client

## Testing Checklist

- [ ] Navigate to lead detail page
- [ ] View lead information
- [ ] Edit lead information
- [ ] Change lead status
- [ ] Create a note
- [ ] Edit a note
- [ ] Delete a note
- [ ] Upload an attachment
- [ ] Download an attachment
- [ ] Delete an attachment
- [ ] Log a phone call
- [ ] Log an email
- [ ] Log WhatsApp communication
- [ ] Log SMS communication
- [ ] View activity timeline
- [ ] View status history
- [ ] Delete lead (with confirmation)
- [ ] Test responsive layout
- [ ] Test dark mode

## Future Enhancements

Potential improvements:
1. Real-time updates using Supabase subscriptions
2. Rich text editor for notes
3. Email integration (send emails directly)
4. Call recording integration
5. Task/reminder system
6. Lead scoring visualization
7. Export lead details to PDF
8. Duplicate lead detection
9. Lead merge functionality
10. Bulk actions on timeline items

## Troubleshooting

### Attachments not uploading
- Check Supabase storage bucket exists
- Verify storage policies are set
- Check file size (max 10 MB)

### Status not updating
- Verify `historique_actions` table exists
- Check user permissions

### Notes not saving
- Verify `notes` table exists
- Check RLS policies

## Support

For issues or questions:
1. Check `DATABASE_SCHEMA.md` for database setup
2. Verify all required tables exist
3. Check browser console for errors
4. Verify Supabase connection
