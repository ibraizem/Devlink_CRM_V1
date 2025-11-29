# Workflow Automation - Quick Start Guide

## Getting Started

### 1. Access Workflows
Navigate to **Workflows** in the sidebar (⚡ icon) or go directly to `/workflows`

### 2. Create Your First Workflow

#### From the List Page:
1. Click **"New Workflow"** button
2. You'll be taken to the workflow editor

#### In the Editor:
1. **Name your workflow** - Click the input at the top
2. **Add nodes** from the left toolbar:
   - **Triggers** (Blue) - How the workflow starts
   - **Actions** (Green) - What the workflow does
   - **Conditions** (Purple) - Decision points

3. **Connect nodes** - Drag from output handle to input handle
4. **Configure nodes** - Click a node to edit in the right panel
5. **Save** - Click the Save button at the top right

### 3. Example: Simple Email Notification

Let's create a workflow that sends an email when a new lead is created:

1. **Add Trigger**
   - Click "Database Event" from the toolbar
   - It appears on the canvas
   - Click it and set:
     - Label: "New Lead Created"
     - Table: leads
     - Event: insert

2. **Add Action**
   - Click "Send Email" from the toolbar
   - Connect the trigger's output to the action's input
   - Click it and set:
     - Label: "Send Welcome Email"
     - To: admin@example.com
     - Subject: "New Lead"
     - Body: "A new lead was created"

3. **Save the Workflow**
   - Click "Save" button
   - Your workflow is now saved!

### 4. Test Your Workflow

1. Click **"Test Run"** button
2. Go to the **"History"** tab on the right
3. Watch the execution in real-time
4. Check execution logs for debugging

## Node Types Reference

### Triggers (Start Points)

| Type | Description | Use Case |
|------|-------------|----------|
| **Webhook** | HTTP endpoint | External system integration |
| **Schedule** | Cron-based timer | Daily reports, recurring tasks |
| **Database Event** | Table changes | React to data changes |
| **Manual** | User-initiated | One-time operations |

### Actions (Operations)

| Type | Description | Use Case |
|------|-------------|----------|
| **Send Email** | Send emails | Notifications, alerts |
| **Create Task** | Create tasks | Follow-ups, reminders |
| **Update Lead** | Modify lead data | Status updates, enrichment |
| **Create Lead** | Add new lead | Data import, conversions |
| **Send Notification** | Push notifications | Real-time alerts |
| **HTTP Request** | API calls | External integrations |
| **Delay** | Wait period | Timed sequences |
| **Create Rendez-vous** | Schedule meetings | Appointment booking |

### Logic (Decision Points)

| Type | Description | Use Case |
|------|-------------|----------|
| **Condition** | If/else branching | Qualify leads, route data |

## Common Workflows

### 1. Lead Notification
**Trigger:** Database Event (leads, insert)  
**Action:** Send Email  
**Purpose:** Notify team of new leads

### 2. Daily Report
**Trigger:** Schedule (0 9 * * *)  
**Action:** HTTP Request → Send Email  
**Purpose:** Daily summary reports

### 3. Lead Qualification
**Trigger:** Database Event (leads, update)  
**Condition:** Check lead value  
**Actions:** Assign to appropriate agent  
**Purpose:** Auto-route high-value leads

### 4. Follow-up Reminder
**Trigger:** Schedule (daily)  
**Action:** Create Task  
**Purpose:** Remind to contact inactive leads

## Tips & Best Practices

### ✅ Do's
- **Name workflows clearly** - "Lead Welcome Email" not "Workflow 1"
- **Add descriptions** - Explain what each node does
- **Test before activating** - Use "Test Run" to verify
- **Start simple** - Begin with 2-3 nodes
- **Use conditions wisely** - Branch only when needed

### ❌ Don'ts
- **Don't create loops** - Can cause infinite execution
- **Don't skip testing** - Always test before production
- **Don't over-complicate** - Keep workflows focused
- **Don't forget error handling** - Plan for failures

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl/Cmd + S** | Save workflow |
| **Delete** | Remove selected node |
| **Ctrl/Cmd + Z** | Undo (canvas) |
| **Space + Drag** | Pan canvas |
| **Scroll** | Zoom in/out |

## Troubleshooting

### Workflow Won't Save
- Check that workflow has a name
- Ensure at least one trigger exists
- Verify all nodes are valid

### Node Won't Connect
- Check connection direction (output → input)
- Ensure nodes are compatible
- Trigger nodes can only be sources

### Execution Failed
- Check execution history for errors
- Verify node configurations
- Test individual actions first

### Can't Find Workflow
- Check the workflows list page
- Look at status filter (active/inactive/draft)
- Try refreshing the page

## Next Steps

1. **Explore Templates** - Check pre-built workflow examples
2. **Read Full Docs** - See `app/workflows/README.md`
3. **Watch History** - Monitor execution logs
4. **Experiment** - Try different node combinations

## Getting Help

- **Documentation**: `app/workflows/README.md`
- **Types Reference**: `lib/types/workflow.ts`
- **Examples**: `lib/data/workflow-examples.ts`
- **Feature Overview**: `WORKFLOW_FEATURE.md`

## Video Walkthrough (Conceptual)

1. **0:00** - Introduction to workflows
2. **0:30** - Creating your first workflow
3. **2:00** - Adding and connecting nodes
4. **4:00** - Configuring triggers and actions
5. **6:00** - Testing and debugging
6. **8:00** - Viewing execution history
7. **10:00** - Best practices and tips

---

**Ready to automate?** Head to `/workflows` and start building! 🚀
