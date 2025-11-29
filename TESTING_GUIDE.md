# Testing Guide for Lead Detail Feature

## Manual Testing Steps

### Prerequisites
1. Ensure you have run the database migrations (see `DATABASE_SCHEMA.md`)
2. Have at least one lead in the database
3. Be logged in as an authenticated user

### Test 1: Navigation
- [ ] From leads list, click on a lead
- [ ] URL changes to `/dashboard/leads/[id]`
- [ ] Lead detail page loads successfully
- [ ] Back button returns to leads list

### Test 2: Lead Information Display
- [ ] Lead name displays in header
- [ ] Email, phone, and address display correctly
- [ ] Assigned agent shows if present
- [ ] Status badge displays with correct color
- [ ] Creation date shows formatted correctly
- [ ] Custom fields display if present

### Test 3: Status Change
- [ ] Click status dropdown
- [ ] Select different status
- [ ] Success toast appears
- [ ] Status updates in UI
- [ ] Status change appears in history tab
- [ ] Refresh page - status persists

### Test 4: Edit Lead
- [ ] Click edit button in header
- [ ] Dialog opens with current data
- [ ] Modify name field
- [ ] Modify email field
- [ ] Click "Enregistrer"
- [ ] Success toast appears
- [ ] Changes reflect in info card
- [ ] Cancel button closes dialog without saving

### Test 5: Notes Management

#### Create Note
- [ ] Go to "Notes" tab
- [ ] Type text in textarea
- [ ] Click "Ajouter une note"
- [ ] Note appears in list
- [ ] Shows current user as author
- [ ] Shows timestamp
- [ ] Note appears in timeline tab

#### Edit Note
- [ ] Click edit icon on a note
- [ ] Textarea appears with current content
- [ ] Modify text
- [ ] Click "Enregistrer"
- [ ] Note updates in list
- [ ] Updated_at timestamp changes

#### Delete Note
- [ ] Click delete icon on a note
- [ ] Confirmation dialog appears
- [ ] Click "Supprimer"
- [ ] Note removed from list

### Test 6: Attachments

#### Upload File
- [ ] Go to "Pièces jointes" tab
- [ ] Click "Choisir un fichier"
- [ ] Select a file (PDF, image, etc.)
- [ ] File uploads successfully
- [ ] File appears in list with name, size, date
- [ ] Attachment activity appears in timeline

#### Download File
- [ ] Click download icon
- [ ] File downloads to device

#### View File
- [ ] Click view/eye icon
- [ ] File opens in new tab

#### Delete File
- [ ] Click delete icon
- [ ] Confirmation dialog appears
- [ ] Click "Supprimer"
- [ ] File removed from list and storage

#### Error Handling
- [ ] Try uploading file > 10 MB
- [ ] Error message appears

### Test 7: Activity Timeline
- [ ] Go to "Timeline" tab
- [ ] See all activities in chronological order
- [ ] Different activity types have different icons
- [ ] Status changes show old → new status
- [ ] Each activity shows agent name and timestamp
- [ ] Notes show in timeline
- [ ] Communications show in timeline

### Test 8: Status History
- [ ] Go to "Historique" tab
- [ ] See only status changes
- [ ] Each change shows:
  - [ ] Old status with color
  - [ ] New status with color
  - [ ] Agent who made change
  - [ ] Timestamp
  - [ ] Arrow showing transition

### Test 9: Communication Panel

#### Phone Call
- [ ] Click "Appel" button
- [ ] Dialog opens
- [ ] Enter duration
- [ ] Enter notes
- [ ] Enter result
- [ ] Click "Enregistrer"
- [ ] Activity appears in timeline
- [ ] Success toast appears

#### Email
- [ ] Click "Email" button
- [ ] Dialog opens
- [ ] Enter description
- [ ] Click "Enregistrer"
- [ ] Activity logged in timeline

#### WhatsApp
- [ ] Click "WhatsApp" button
- [ ] Dialog opens
- [ ] Log communication
- [ ] Activity saved

#### SMS
- [ ] Click "SMS" button
- [ ] Dialog opens
- [ ] Log communication
- [ ] Activity saved

#### Contact Info Links
- [ ] Click phone number - opens dialer
- [ ] Click email - opens mail client
- [ ] Click "Ouvrir WhatsApp" - opens WhatsApp Web
- [ ] Click "Envoyer SMS" - opens SMS app

### Test 10: Delete Lead
- [ ] Click delete icon in header
- [ ] Confirmation dialog appears
- [ ] Click "Supprimer"
- [ ] Lead deleted
- [ ] Redirected to leads list
- [ ] Lead no longer in list

### Test 11: Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768px)
- [ ] Test on mobile (375px)
- [ ] Sidebar stacks below content on mobile
- [ ] All buttons accessible
- [ ] No horizontal scroll

### Test 12: Dark Mode
- [ ] Toggle dark mode
- [ ] All components render correctly
- [ ] Text readable
- [ ] Cards have proper contrast
- [ ] Icons visible

### Test 13: Error Handling
- [ ] Navigate to non-existent lead ID
- [ ] "Lead introuvable" message shows
- [ ] Back button appears
- [ ] No console errors

### Test 14: Permissions
- [ ] Test with different user roles
- [ ] Verify RLS policies work
- [ ] Users can only see/edit allowed leads

### Test 15: Performance
- [ ] Lead with 50+ notes loads quickly
- [ ] Lead with 20+ attachments loads quickly
- [ ] Timeline with 100+ activities scrolls smoothly
- [ ] No memory leaks on tab switches

## Automated Testing (Future)

### Unit Tests
```typescript
// Example test for LeadInfoCard
describe('LeadInfoCard', () => {
  it('renders lead information', () => {
    const lead = { nom: 'Doe', prenom: 'John', email: 'john@example.com' };
    render(<LeadInfoCard lead={lead} onUpdate={jest.fn()} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
// Example test for creating a note
describe('Notes functionality', () => {
  it('creates a note successfully', async () => {
    render(<NotesSection leadId="123" />);
    const textarea = screen.getByPlaceholderText('Écrivez une note...');
    fireEvent.change(textarea, { target: { value: 'Test note' } });
    fireEvent.click(screen.getByText('Ajouter une note'));
    await waitFor(() => {
      expect(screen.getByText('Test note')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests
```typescript
// Example Playwright test
test('complete lead detail workflow', async ({ page }) => {
  await page.goto('/dashboard/leads/123');
  await page.click('text=Notes');
  await page.fill('textarea', 'Important note');
  await page.click('text=Ajouter une note');
  await expect(page.locator('text=Important note')).toBeVisible();
});
```

## Common Issues and Solutions

### Issue: Attachments not uploading
**Solution**: 
1. Check Supabase storage bucket exists
2. Verify policies are set correctly
3. Check browser console for CORS errors

### Issue: Status not updating
**Solution**:
1. Check `historique_actions` table exists
2. Verify user has UPDATE permission on leads table
3. Check network tab for API errors

### Issue: Notes not displaying
**Solution**:
1. Verify `notes` table exists with correct foreign key
2. Check RLS policies allow SELECT
3. Verify lead_id is correct

### Issue: Communication buttons disabled
**Solution**:
1. Check lead has email/telephone fields populated
2. Verify fields are not null in database

### Issue: Page not loading
**Solution**:
1. Check lead ID is valid UUID
2. Verify lead exists in database
3. Check Supabase connection
4. Look for console errors

## Performance Benchmarks

Expected performance metrics:
- Initial page load: < 1 second
- Status update: < 500ms
- Note creation: < 300ms
- File upload (5MB): < 3 seconds
- Timeline render (100 items): < 500ms

## Browser Compatibility

Tested browsers:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Accessibility Testing

- [ ] All buttons have aria-labels
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Alt text on icons

## Security Checklist

- [ ] SQL injection protection (via Supabase)
- [ ] XSS protection (React escaping)
- [ ] CSRF protection (Supabase auth)
- [ ] File upload validation
- [ ] RLS policies enforced
- [ ] No sensitive data in logs
- [ ] API calls authenticated

## Test Data Setup

```sql
-- Insert test lead
INSERT INTO leads (nom, prenom, email, telephone, statut)
VALUES ('Test', 'User', 'test@example.com', '+33612345678', 'nouveau');

-- Insert test notes
INSERT INTO notes (lead_id, auteur_id, contenu)
VALUES 
  ('lead-id', 'user-id', 'First test note'),
  ('lead-id', 'user-id', 'Second test note');

-- Insert test history
INSERT INTO historique_actions (lead_id, agent_id, type_action, description)
VALUES
  ('lead-id', 'user-id', 'appel', 'Called customer'),
  ('lead-id', 'user-id', 'statut_change', 'Changed status', '{"old_statut": "nouveau", "new_statut": "en_cours"}');
```
