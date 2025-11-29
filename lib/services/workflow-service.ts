import { Workflow, WorkflowExecution, WorkflowExecutionLog, WorkflowTemplate } from '@/lib/types/workflow';

const STORAGE_KEY = 'workflows';
const EXECUTIONS_KEY = 'workflow_executions';
const EXECUTION_LOGS_KEY = 'workflow_execution_logs';

export async function getWorkflows(): Promise<Workflow[]> {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function getWorkflowById(id: string): Promise<Workflow | null> {
  const workflows = await getWorkflows();
  return workflows.find((w) => w.id === id) || null;
}

export async function createWorkflow(workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at' | 'run_count'>): Promise<Workflow> {
  const workflows = await getWorkflows();
  const newWorkflow: Workflow = {
    ...workflow,
    id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    run_count: 0,
  };
  workflows.push(newWorkflow);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
  return newWorkflow;
}

export async function updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
  const workflows = await getWorkflows();
  const index = workflows.findIndex((w) => w.id === id);
  if (index === -1) throw new Error('Workflow not found');
  
  workflows[index] = {
    ...workflows[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
  return workflows[index];
}

export async function deleteWorkflow(id: string): Promise<void> {
  const workflows = await getWorkflows();
  const filtered = workflows.filter((w) => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export async function toggleWorkflowStatus(id: string, newStatus: 'active' | 'inactive'): Promise<void> {
  await updateWorkflow(id, { status: newStatus });
}

export async function duplicateWorkflow(id: string): Promise<Workflow> {
  const original = await getWorkflowById(id);
  if (!original) throw new Error('Workflow not found');
  
  return createWorkflow({
    ...original,
    name: `${original.name} (Copy)`,
    status: 'draft',
    created_by: original.created_by,
  });
}

export async function getWorkflowExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(EXECUTIONS_KEY);
  const executions: WorkflowExecution[] = stored ? JSON.parse(stored) : [];
  return workflowId ? executions.filter((e) => e.workflow_id === workflowId) : executions;
}

export async function getWorkflowExecutionById(id: string): Promise<WorkflowExecution | null> {
  const executions = await getWorkflowExecutions();
  return executions.find((e) => e.id === id) || null;
}

export async function createWorkflowExecution(workflowId: string, triggerData?: any): Promise<WorkflowExecution> {
  const executions = await getWorkflowExecutions();
  const newExecution: WorkflowExecution = {
    id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    workflow_id: workflowId,
    status: 'running',
    started_at: new Date().toISOString(),
    trigger_data: triggerData,
    execution_log: [],
  };
  executions.push(newExecution);
  localStorage.setItem(EXECUTIONS_KEY, JSON.stringify(executions));
  
  await updateWorkflow(workflowId, {
    last_run_at: new Date().toISOString(),
    run_count: (await getWorkflowById(workflowId))!.run_count + 1,
  });
  
  return newExecution;
}

export async function updateWorkflowExecution(id: string, updates: Partial<WorkflowExecution>): Promise<WorkflowExecution> {
  const executions = await getWorkflowExecutions();
  const index = executions.findIndex((e) => e.id === id);
  if (index === -1) throw new Error('Execution not found');
  
  executions[index] = {
    ...executions[index],
    ...updates,
  };
  localStorage.setItem(EXECUTIONS_KEY, JSON.stringify(executions));
  return executions[index];
}

export async function getWorkflowExecutionLogs(executionId: string): Promise<WorkflowExecutionLog[]> {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(EXECUTION_LOGS_KEY);
  const logs: WorkflowExecutionLog[] = stored ? JSON.parse(stored) : [];
  return logs.filter((log) => log.execution_id === executionId);
}

export async function addWorkflowExecutionLog(log: Omit<WorkflowExecutionLog, 'id'>): Promise<WorkflowExecutionLog> {
  if (typeof window === 'undefined') throw new Error('Not in browser');
  const stored = localStorage.getItem(EXECUTION_LOGS_KEY);
  const logs: WorkflowExecutionLog[] = stored ? JSON.parse(stored) : [];
  const newLog: WorkflowExecutionLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  logs.push(newLog);
  localStorage.setItem(EXECUTION_LOGS_KEY, JSON.stringify(logs));
  return newLog;
}

export async function getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  return [
    {
      id: 'template_new_lead',
      name: 'New Lead Notification',
      description: 'Send notification when a new lead is created',
      category: 'Lead Management',
      icon: 'User',
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          position: { x: 250, y: 50 },
          data: {
            label: 'Database Event',
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
          position: { x: 250, y: 200 },
          data: {
            label: 'Send Email',
            actionConfig: {
              type: 'send_email',
              config: {
                email: {
                  to: 'admin@example.com',
                  subject: 'New Lead Created',
                  body: 'A new lead has been added to the system.',
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
        },
      ],
    },
    {
      id: 'template_follow_up',
      name: 'Lead Follow-up Reminder',
      description: 'Send reminder for leads not contacted in 3 days',
      category: 'Lead Management',
      icon: 'Clock',
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          position: { x: 250, y: 50 },
          data: {
            label: 'Schedule',
            triggerConfig: {
              type: 'schedule',
              config: {
                schedule: {
                  type: 'cron',
                  value: '0 9 * * *',
                },
              },
            },
          },
        },
        {
          id: 'action_1',
          type: 'action',
          position: { x: 250, y: 200 },
          data: {
            label: 'Create Task',
            actionConfig: {
              type: 'create_task',
              config: {
                task: {
                  title: 'Follow up with lead',
                  description: 'Contact lead that has not been reached in 3 days',
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
        },
      ],
    },
  ];
}
