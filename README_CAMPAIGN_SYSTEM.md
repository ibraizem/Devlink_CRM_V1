# Campaign Execution Engine

A comprehensive multi-channel campaign automation system with scheduling, lead scoring, and progression rules.

## Quick Start

### 1. Database Setup

Run the SQL migration to create campaign tables:

```bash
# Using psql
psql -d your_database < campaign_tables.sql

# Or use Supabase SQL Editor
# Copy contents of campaign_tables.sql and execute
```

### 2. Initialize Scheduler

```typescript
import { schedulingService } from '@/lib/services/schedulingService';

schedulingService.startScheduler();
```

### 3. Create Your First Campaign

```typescript
import { campaignService } from '@/lib/services/campaignService';
import { campaignExecutionEngine } from '@/lib/services/campaignExecutionEngine';

// Create campaign
const campaign = await campaignService.createCampaign({
  name: 'Welcome Series',
  description: 'New customer onboarding',
  status: 'draft',
  created_by: userId,
});

// Add email sequence
await campaignService.createSequence({
  campaign_id: campaign.id,
  name: 'Welcome Email',
  channel: 'email',
  order: 1,
  delay_days: 0,
  delay_hours: 0,
  is_active: true,
});

// Enroll leads
await campaignService.enrollLeads(campaign.id, leadIds);

// Start campaign
await campaignExecutionEngine.startCampaign(campaign.id);
```

## Features

- ✅ **Multi-Channel Outreach**: Email, SMS, and Call automation
- ✅ **Intelligent Scheduling**: Time-based delays and conditional execution
- ✅ **Lead Scoring**: Dynamic scoring based on engagement and attributes
- ✅ **Progression Rules**: Automatic lead status transitions
- ✅ **Follow-up Tasks**: Auto-generated tasks for agent follow-up
- ✅ **Progress Tracking**: Real-time campaign metrics and reporting
- ✅ **Template Management**: Reusable email and SMS templates

## React Hooks

```typescript
import {
  useCampaigns,
  useCampaign,
  useCreateCampaign,
  useStartCampaign,
  useCampaignProgress,
  useCampaignTasks,
} from '@/hooks/useCampaigns';

// List active campaigns
const { data: campaigns } = useCampaigns({ status: 'active' });

// Get campaign progress
const { data: progress } = useCampaignProgress(campaignId);

// Get pending tasks
const { data: tasks } = useCampaignTasks(campaignId, { status: 'pending' });
```

## Documentation

See [CAMPAIGN_SYSTEM.md](./CAMPAIGN_SYSTEM.md) for complete documentation including:

- Architecture overview
- API reference
- Database schema
- Usage examples
- Best practices

## Files Created

### Types
- `types/campaign.ts` - TypeScript type definitions

### Services
- `lib/services/campaignService.ts` - Core CRUD operations
- `lib/services/campaignExecutionEngine.ts` - Execution engine
- `lib/services/schedulingService.ts` - Background scheduler

### Hooks
- `hooks/useCampaigns.ts` - React Query hooks

### Database
- `campaign_tables.sql` - Database migration

### Documentation
- `CAMPAIGN_SYSTEM.md` - Comprehensive documentation
- `README_CAMPAIGN_SYSTEM.md` - Quick start guide
