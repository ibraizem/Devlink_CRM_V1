# Campaign Execution Engine Documentation

## Overview

The Campaign Execution Engine is a comprehensive system for managing multi-channel outreach campaigns with automated scheduling, lead scoring, progression rules, and task generation.

## Architecture

### Core Components

1. **Campaign Service** (`lib/services/campaignService.ts`)
   - CRUD operations for campaigns, sequences, leads, outreaches, and tasks
   - Template management (email and SMS)
   - Progress tracking and reporting

2. **Campaign Execution Engine** (`lib/services/campaignExecutionEngine.ts`)
   - Automated outreach execution
   - Lead scoring calculations
   - Progression rule evaluation
   - Follow-up task generation
   - Campaign lifecycle management

3. **Scheduling Service** (`lib/services/schedulingService.ts`)
   - Background task scheduling
   - Scheduled execution management
   - Recurring task support

## Features

### 1. Multi-Channel Outreach Automation

The system supports three communication channels:

- **Email**: Automated email sequences with tracking
- **SMS**: SMS campaigns with delivery tracking
- **Call**: Automated call task creation and scheduling

#### Creating a Sequence

```typescript
import { campaignService } from '@/lib/services/campaignService';

const sequence = await campaignService.createSequence({
  campaign_id: 'campaign-uuid',
  name: 'Initial Contact',
  channel: 'email',
  order: 1,
  delay_days: 0,
  delay_hours: 0,
  template_id: 'template-uuid',
  content: { /* template variables */ },
  is_active: true,
});
```

### 2. Scheduling System

Outreaches are automatically scheduled based on sequence configuration:

- **Delay Configuration**: Set delays in days and hours
- **Conditional Execution**: Apply conditions before sending
- **Status Tracking**: Track sent, delivered, opened, clicked, replied states

#### Starting a Campaign

```typescript
import { campaignExecutionEngine } from '@/lib/services/campaignExecutionEngine';

await campaignExecutionEngine.startCampaign('campaign-uuid');
```

This will:
1. Activate the campaign
2. Enroll all leads
3. Schedule initial outreaches
4. Begin automated execution

### 3. Lead Scoring

Dynamic lead scoring based on configurable rules:

```typescript
const scoringRules: LeadScoringRule[] = [
  {
    id: 'rule-1',
    name: 'Email Opened',
    condition: {
      field: 'email_opened',
      operator: 'equals',
      value: true,
    },
    score_change: 10,
    is_active: true,
  },
  {
    id: 'rule-2',
    name: 'High Budget',
    condition: {
      field: 'budget',
      operator: 'greater_than',
      value: 10000,
    },
    score_change: 25,
    is_active: true,
  },
];
```

#### Operators Supported

- `equals` / `not_equals`
- `contains` / `not_contains`
- `greater_than` / `less_than`
- `exists` / `not_exists`

### 4. Progression Rules

Automatically move leads through the pipeline based on conditions:

```typescript
const progressionRules: ProgressionRule[] = [
  {
    id: 'rule-1',
    name: 'Move to Qualified',
    from_status: 'nouveau',
    to_status: 'qualifie',
    conditions: [
      {
        field: 'score',
        operator: 'greater_than',
        value: 50,
      },
      {
        field: 'email_replied',
        operator: 'equals',
        value: true,
      },
    ],
    actions: [
      {
        type: 'create_task',
        params: {
          title: 'Follow up with qualified lead',
          task_type: 'call',
          priority: 'high',
          due_date: new Date(Date.now() + 86400000).toISOString(),
        },
      },
      {
        type: 'assign_to',
        params: {
          agent_id: 'agent-uuid',
        },
      },
    ],
    is_active: true,
  },
];
```

#### Available Actions

- `update_field`: Update lead field values
- `create_task`: Generate follow-up tasks
- `assign_to`: Assign lead to an agent
- `send_notification`: Send notifications

### 5. Follow-up Task Generation

Automatically generate tasks based on lead interactions:

```typescript
// Automatic task generation for leads who replied
await campaignExecutionEngine.generateFollowUpTasks('campaign-uuid');
```

Tasks are created for:
- Email replies
- Link clicks
- SMS responses
- Scheduled calls

### 6. Campaign Progress Tracking

Real-time progress tracking with comprehensive metrics:

```typescript
import { useCampaignProgress } from '@/hooks/useCampaigns';

const { data: progress } = useCampaignProgress('campaign-uuid');

// Returns:
// {
//   total_leads: 100,
//   enrolled: 95,
//   active: 80,
//   completed: 10,
//   paused: 5,
//   exited: 0,
//   emails_sent: 150,
//   emails_opened: 75,
//   emails_clicked: 30,
//   emails_replied: 15,
//   sms_sent: 50,
//   sms_replied: 10,
//   calls_completed: 25,
//   tasks_pending: 20,
//   tasks_completed: 30,
//   avg_score: 42.5,
// }
```

## React Hooks

### Campaign Management

```typescript
import {
  useCampaigns,
  useCampaign,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useStartCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useCompleteCampaign,
} from '@/hooks/useCampaigns';

// List campaigns
const { data: campaigns } = useCampaigns({ status: 'active' });

// Get single campaign
const { data: campaign } = useCampaign('campaign-uuid');

// Create campaign
const createMutation = useCreateCampaign();
await createMutation.mutateAsync({
  name: 'Q1 Outreach',
  description: 'First quarter campaign',
  status: 'draft',
  created_by: 'user-uuid',
});

// Start campaign
const startMutation = useStartCampaign();
await startMutation.mutateAsync('campaign-uuid');
```

### Sequence Management

```typescript
import {
  useCampaignSequences,
  useCreateSequence,
  useUpdateSequence,
  useDeleteSequence,
} from '@/hooks/useCampaigns';

const { data: sequences } = useCampaignSequences('campaign-uuid');
```

### Lead Management

```typescript
import {
  useCampaignLeads,
  useEnrollLeads,
} from '@/hooks/useCampaigns';

// Get campaign leads
const { data: leads } = useCampaignLeads('campaign-uuid', 'active');

// Enroll leads
const enrollMutation = useEnrollLeads();
await enrollMutation.mutateAsync({
  campaignId: 'campaign-uuid',
  leadIds: ['lead-1', 'lead-2', 'lead-3'],
});
```

### Task Management

```typescript
import {
  useCampaignTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '@/hooks/useCampaigns';

const { data: tasks } = useCampaignTasks('campaign-uuid', {
  status: 'pending',
  assigned_to: 'user-uuid',
});
```

## Database Schema

### Tables

- **campaigns**: Campaign configuration and metadata
- **campaign_sequences**: Multi-channel outreach sequences
- **campaign_leads**: Lead enrollment and tracking
- **campaign_outreaches**: Individual outreach attempts
- **campaign_tasks**: Generated follow-up tasks
- **email_templates**: Reusable email templates
- **sms_templates**: Reusable SMS templates
- **scheduled_executions**: Scheduled automation tasks

### Key Relationships

```
campaigns (1) -> (N) campaign_sequences
campaigns (1) -> (N) campaign_leads
campaigns (1) -> (N) campaign_tasks

campaign_leads (1) -> (N) campaign_outreaches
campaign_sequences (1) -> (N) campaign_outreaches
```

## Setup

### 1. Database Migration

Run the SQL migration to create all necessary tables:

```bash
psql -d your_database < campaign_tables.sql
```

Or use Supabase SQL editor to execute the contents of `campaign_tables.sql`.

### 2. Start Scheduler

Initialize the scheduling service in your application:

```typescript
import { schedulingService } from '@/lib/services/schedulingService';

// In your app initialization
schedulingService.startScheduler();

// Clean up on unmount
// schedulingService.stopScheduler();
```

### 3. Environment Configuration

Ensure Supabase environment variables are configured:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Usage Examples

### Example 1: Creating a Simple Email Campaign

```typescript
import { campaignService } from '@/lib/services/campaignService';
import { campaignExecutionEngine } from '@/lib/services/campaignExecutionEngine';

// 1. Create campaign
const campaign = await campaignService.createCampaign({
  name: 'Welcome Series',
  description: 'New customer welcome emails',
  status: 'draft',
  created_by: userId,
  lead_scoring_rules: [
    {
      id: '1',
      name: 'Email Opened',
      condition: { field: 'opened', operator: 'equals', value: true },
      score_change: 10,
      is_active: true,
    },
  ],
});

// 2. Create email sequences
await campaignService.createSequence({
  campaign_id: campaign.id,
  name: 'Welcome Email',
  channel: 'email',
  order: 1,
  delay_days: 0,
  delay_hours: 0,
  template_id: welcomeTemplateId,
  is_active: true,
});

await campaignService.createSequence({
  campaign_id: campaign.id,
  name: 'Follow-up Email',
  channel: 'email',
  order: 2,
  delay_days: 3,
  delay_hours: 0,
  template_id: followUpTemplateId,
  is_active: true,
});

// 3. Enroll leads
await campaignService.enrollLeads(campaign.id, leadIds);

// 4. Start campaign
await campaignExecutionEngine.startCampaign(campaign.id);
```

### Example 2: Multi-Channel Campaign

```typescript
// Email -> SMS -> Call sequence
await campaignService.createSequence({
  campaign_id: campaign.id,
  name: 'Initial Email',
  channel: 'email',
  order: 1,
  delay_days: 0,
  delay_hours: 0,
  is_active: true,
});

await campaignService.createSequence({
  campaign_id: campaign.id,
  name: 'Follow-up SMS',
  channel: 'sms',
  order: 2,
  delay_days: 2,
  delay_hours: 0,
  is_active: true,
});

await campaignService.createSequence({
  campaign_id: campaign.id,
  name: 'Personal Call',
  channel: 'call',
  order: 3,
  delay_days: 5,
  delay_hours: 0,
  is_active: true,
});
```

### Example 3: Advanced Scoring & Progression

```typescript
const campaign = await campaignService.createCampaign({
  name: 'Sales Qualification',
  status: 'draft',
  created_by: userId,
  lead_scoring_rules: [
    {
      id: '1',
      name: 'Email Opened',
      condition: { field: 'email_opened', operator: 'equals', value: true },
      score_change: 5,
      is_active: true,
    },
    {
      id: '2',
      name: 'Link Clicked',
      condition: { field: 'link_clicked', operator: 'equals', value: true },
      score_change: 15,
      is_active: true,
    },
    {
      id: '3',
      name: 'Replied',
      condition: { field: 'replied', operator: 'equals', value: true },
      score_change: 30,
      is_active: true,
    },
  ],
  progression_rules: [
    {
      id: '1',
      name: 'Auto-qualify high scorers',
      from_status: 'nouveau',
      to_status: 'qualifie',
      conditions: [
        { field: 'score', operator: 'greater_than', value: 40 },
      ],
      actions: [
        {
          type: 'create_task',
          params: {
            title: 'Call qualified lead',
            task_type: 'call',
            priority: 'high',
          },
        },
      ],
      is_active: true,
    },
  ],
});
```

## Best Practices

1. **Test sequences with small groups first** before enrolling all leads
2. **Monitor campaign progress regularly** using the progress tracking
3. **Set appropriate delays** between outreaches to avoid overwhelming leads
4. **Use scoring rules strategically** to identify engaged leads
5. **Create follow-up tasks** for high-priority interactions
6. **Pause campaigns** if adjustments are needed rather than deleting
7. **Use templates** for consistent messaging across campaigns

## Performance Considerations

- The scheduler runs background tasks at regular intervals
- Outreaches are processed in batches to optimize performance
- Progress tracking uses database functions for efficiency
- Indexes are created on all frequently queried fields

## Troubleshooting

### Outreaches not sending

- Check campaign status is 'active'
- Verify sequences have `is_active: true`
- Ensure leads are enrolled with status 'enrolled' or 'active'
- Check scheduled_at timestamps are in the past

### Scoring not updating

- Verify lead_scoring_rules are properly formatted
- Check that conditions reference existing lead fields
- Ensure rules have `is_active: true`

### Tasks not generating

- Verify progression rules are active
- Check that conditions are being met
- Ensure task creation actions have all required params
