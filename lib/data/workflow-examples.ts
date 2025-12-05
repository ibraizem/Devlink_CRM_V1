import { Workflow } from '@/lib/types/workflow';

export const exampleWorkflows: Omit<Workflow, 'id' | 'created_at' | 'updated_at' | 'run_count'>[] = [
  {
    name: 'New Lead Email Notification',
    description: 'Automatically send an email notification when a new lead is created in the system',
    status: 'active',
    created_by: 'system',
    last_run_at: new Date().toISOString(),
    nodes: [
      {
        id: 'trigger_1',
        type: 'trigger',
        position: { x: 250, y: 100 },
        data: {
          label: 'New Lead Created',
          description: 'Triggers when a lead is inserted into the database',
          triggerConfig: {
            type: 'database_event',
            config: {
              databaseEvent: {
                table: 'leads',
                event: 'insert',
              },
            },
          },
        },
      },
      {
        id: 'action_1',
        type: 'action',
        position: { x: 250, y: 250 },
        data: {
          label: 'Send Email to Admin',
          description: 'Notify the admin team about the new lead',
          actionConfig: {
            type: 'send_email',
            config: {
              email: {
                to: 'admin@example.com',
                subject: 'New Lead: {{lead.name}}',
                body: 'A new lead has been created:\n\nName: {{lead.name}}\nEmail: {{lead.email}}\nPhone: {{lead.phone}}\nSource: {{lead.source}}',
              },
            },
          },
        },
      },
      {
        id: 'action_2',
        type: 'action',
        position: { x: 250, y: 400 },
        data: {
          label: 'Create Follow-up Task',
          description: 'Create a task to contact the lead within 24 hours',
          actionConfig: {
            type: 'create_task',
            config: {
              task: {
                title: 'Contact new lead: {{lead.name}}',
                description: 'Initial contact with lead created on {{lead.created_at}}',
                dueDate: '{{date.add(1, "day")}}',
              },
            },
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'trigger_1',
        target: 'action_1',
        type: 'default',
      },
      {
        id: 'edge_2',
        source: 'action_1',
        target: 'action_2',
        type: 'default',
      },
    ],
  },
  {
    name: 'Lead Qualification Workflow',
    description: 'Automatically qualify leads based on criteria and assign to appropriate team members',
    status: 'active',
    created_by: 'system',
    nodes: [
      {
        id: 'trigger_1',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: {
          label: 'Lead Status Updated',
          description: 'Triggers when lead status changes',
          triggerConfig: {
            type: 'database_event',
            config: {
              databaseEvent: {
                table: 'leads',
                event: 'update',
                filters: { status: 'qualified' },
              },
            },
          },
        },
      },
      {
        id: 'condition_1',
        type: 'condition',
        position: { x: 250, y: 200 },
        data: {
          label: 'Check Lead Value',
          description: 'Determine if this is a high-value lead',
          actionConfig: {
            type: 'condition',
            config: {
              condition: {
                field: 'lead.estimated_value',
                operator: 'greater_than',
                value: 10000,
              },
            },
          },
        },
      },
      {
        id: 'action_1',
        type: 'action',
        position: { x: 100, y: 350 },
        data: {
          label: 'Assign to Senior Agent',
          description: 'High-value leads go to senior team',
          actionConfig: {
            type: 'update_lead',
            config: {
              leadUpdate: {
                fields: {
                  agent_id: '{{agents.senior.random()}}',
                  priority: 'high',
                },
              },
            },
          },
        },
      },
      {
        id: 'action_2',
        type: 'action',
        position: { x: 400, y: 350 },
        data: {
          label: 'Assign to Regular Agent',
          description: 'Standard leads go to regular team',
          actionConfig: {
            type: 'update_lead',
            config: {
              leadUpdate: {
                fields: {
                  agent_id: '{{agents.regular.random()}}',
                  priority: 'normal',
                },
              },
            },
          },
        },
      },
      {
        id: 'action_3',
        type: 'action',
        position: { x: 250, y: 500 },
        data: {
          label: 'Send Welcome Email',
          description: 'Send personalized welcome email to lead',
          actionConfig: {
            type: 'send_email',
            config: {
              email: {
                to: '{{lead.email}}',
                subject: 'Welcome to DevLink CRM',
                body: '',
                template: 'welcome_qualified_lead',
              },
            },
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'trigger_1',
        target: 'condition_1',
      },
      {
        id: 'edge_2',
        source: 'condition_1',
        target: 'action_1',
        label: 'High Value',
        type: 'success',
      },
      {
        id: 'edge_3',
        source: 'condition_1',
        target: 'action_2',
        label: 'Standard',
        type: 'failure',
      },
      {
        id: 'edge_4',
        source: 'action_1',
        target: 'action_3',
      },
      {
        id: 'edge_5',
        source: 'action_2',
        target: 'action_3',
      },
    ],
  },
];
