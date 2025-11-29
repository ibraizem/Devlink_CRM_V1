'use client';

import { useParams } from 'next/navigation';
import WorkflowBuilder from '@/components/workflows/WorkflowBuilder';

export default function WorkflowPage() {
  const params = useParams();
  const workflowId = params.id === 'new' ? null : (params.id as string);

  return <WorkflowBuilder workflowId={workflowId} />;
}
