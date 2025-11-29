# Workflow Automation System

This feature implements a comprehensive visual workflow automation builder, similar to Zapier or Make.com.

## Features Implemented

### 1. Visual Workflow Designer
- **Drag-and-drop interface** using React Flow
- **Three types of nodes:**
  - **Trigger Nodes** (Blue) - Start workflow execution
  - **Action Nodes** (Green) - Perform operations
  - **Condition Nodes** (Purple) - Branching logic with success/failure paths
- **Visual connections** between nodes with labeled edges
- **Mini-map** for navigation in large workflows
- **Pan & Zoom controls** for canvas navigation

### 2. Trigger Configuration
Supports multiple trigger types:
- **Webhook** - Trigger via HTTP requests
- **Schedule** - Run on cron schedules or intervals
- **Database Events** - Trigger on table insert/update/delete
- **Manual** - Run workflows manually

### 3. Action Blocks
Built-in action types:
- **Send Email** - Send email notifications
- **Create Task** - Create tasks for users
- **Update Lead** - Update existing lead data
- **Create Lead** - Create new leads
- **Send Notification** - Push notifications to users
- **HTTP Request** - Make API calls to external services
- **Delay** - Wait for specified duration
- **Create Rendez-vous** - Schedule appointments

### 4. Conditional Logic
- **Condition nodes** with multiple operators:
  - equals, not_equals, contains
  - greater_than, less_than
  - exists
- **Branching paths** - Success and failure outputs
- **Field-based conditions** - Evaluate any workflow data

### 5. Workflow Execution History
- **Real-time execution tracking**
- **Detailed execution logs** per node
- **Status indicators** (running, completed, failed)
- **Debugging information** including:
  - Input/output data per node
  - Error messages
  - Execution duration
  - Step-by-step progress

## Usage

### Creating a Workflow

1. Navigate to `/workflows`
2. Click "New Workflow"
3. Use the left toolbar to drag nodes onto the canvas
4. Connect nodes by dragging from output to input handles
5. Click nodes to configure their settings in the right panel
6. Save your workflow

### Running a Workflow

1. Open an existing workflow
2. Click "Test Run" to execute manually
3. View execution history in the "History" tab
4. Debug any failures using the execution logs

### Workflow Templates

Two pre-built templates are available:
- **New Lead Notification** - Send email when lead is created
- **Lead Follow-up Reminder** - Daily task creation for old leads

## File Structure

```
app/workflows/
  ├── page.tsx                    # Workflows list page
  ├── [id]/
  │   └── page.tsx               # Workflow editor page
  └── README.md                  # This file

components/workflows/
  ├── WorkflowBuilder.tsx        # Main workflow editor component
  ├── NodeToolbar.tsx            # Node selection toolbar
  ├── WorkflowExecutionHistory.tsx # Execution history viewer
  └── nodes/
      ├── TriggerNode.tsx        # Trigger node component
      ├── ActionNode.tsx         # Action node component
      └── ConditionNode.tsx      # Condition node component

lib/types/workflow.ts            # TypeScript type definitions
lib/services/workflow-service.ts # Workflow CRUD and execution logic
```

## Technical Details

### State Management
- Workflows are stored in localStorage for demo purposes
- In production, these should be stored in Supabase
- React Flow manages canvas state
- Zustand could be used for global workflow state

### Execution Engine
- Currently simulated execution
- Each node logs its execution status
- Supports parallel and sequential execution
- Error handling with try/catch per node

### Next Steps for Production

1. **Database Integration**
   - Create Supabase tables for workflows, executions, and logs
   - Implement real-time updates using Supabase subscriptions

2. **Webhook Endpoints**
   - Create API routes for webhook triggers
   - Implement signature validation

3. **Scheduler Integration**
   - Integrate with cron service (e.g., Vercel Cron, AWS EventBridge)
   - Queue system for scheduled workflows

4. **Action Implementations**
   - Integrate real email service (SendGrid, Resend)
   - Connect to Supabase for database operations
   - Implement HTTP client for external APIs

5. **Advanced Features**
   - Variables and expressions in configurations
   - Loop/iteration support
   - Sub-workflows
   - Workflow versioning
   - Import/export workflows
   - Collaboration features

## Dependencies

- `reactflow` - Visual workflow editor
- `lucide-react` - Icons
- `date-fns` - Date formatting
- All existing shadcn/ui components
