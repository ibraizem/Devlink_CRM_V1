export type WorkflowTriggerType = 'webhook' | 'schedule' | 'database_event' | 'manual';

export type WorkflowActionType = 
  | 'send_email'
  | 'create_task'
  | 'update_lead'
  | 'create_lead'
  | 'send_notification'
  | 'http_request'
  | 'delay'
  | 'condition'
  | 'create_rendezvous';

export type WorkflowNodeType = 'trigger' | 'action' | 'condition';

export interface WorkflowTriggerConfig {
  type: WorkflowTriggerType;
  config: {
    webhookUrl?: string;
    schedule?: {
      type: 'cron' | 'interval';
      value: string;
    };
    databaseEvent?: {
      table: string;
      event: 'insert' | 'update' | 'delete';
      filters?: Record<string, any>;
    };
  };
}

export interface WorkflowActionConfig {
  type: WorkflowActionType;
  config: {
    email?: {
      to: string;
      subject: string;
      body: string;
      template?: string;
    };
    task?: {
      title: string;
      description: string;
      assignee?: string;
      dueDate?: string;
    };
    leadUpdate?: {
      leadId?: string;
      fields: Record<string, any>;
    };
    leadCreate?: {
      fields: Record<string, any>;
    };
    notification?: {
      title: string;
      message: string;
      recipients: string[];
    };
    httpRequest?: {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      headers?: Record<string, string>;
      body?: any;
    };
    delay?: {
      duration: number;
      unit: 'seconds' | 'minutes' | 'hours' | 'days';
    };
    condition?: {
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
      value: any;
    };
    rendezvous?: {
      leadId?: string;
      title: string;
      date: string;
      agentId?: string;
    };
  };
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    triggerConfig?: WorkflowTriggerConfig;
    actionConfig?: WorkflowActionConfig;
    description?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'default' | 'success' | 'failure';
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  created_by: string;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  run_count: number;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  trigger_data?: any;
  error?: string;
  execution_log: WorkflowExecutionLog[];
}

export interface WorkflowExecutionLog {
  id: string;
  execution_id: string;
  node_id: string;
  node_type: WorkflowNodeType;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  started_at: string;
  completed_at?: string;
  input_data?: any;
  output_data?: any;
  error?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  icon: string;
}
