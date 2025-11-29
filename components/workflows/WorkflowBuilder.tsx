'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  Panel,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Play, ArrowLeft, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Workflow } from '@/lib/types/workflow';
import { getWorkflowById, createWorkflow, updateWorkflow, createWorkflowExecution } from '@/lib/services/workflow-service';
import { useToast } from '@/hooks/use-toast';
import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import NodeToolbar from './NodeToolbar';
import WorkflowExecutionHistory from './WorkflowExecutionHistory';

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
};

interface WorkflowBuilderProps {
  workflowId: string | null;
}

export default function WorkflowBuilder({ workflowId }: WorkflowBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [name, setName] = useState('Untitled Workflow');
  const [description, setDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (workflowId) {
      loadWorkflow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  const loadWorkflow = async () => {
    if (!workflowId) return;
    const data = await getWorkflowById(workflowId);
    if (data) {
      setWorkflow(data);
      setName(data.name);
      setDescription(data.description || '');
      setNodes(data.nodes as Node[]);
      setEdges(data.edges as Edge[]);
    }
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const workflowData = {
        name,
        description,
        status: workflow?.status || ('draft' as const),
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type as 'trigger' | 'action' | 'condition',
          position: n.position,
          data: n.data,
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: typeof e.label === 'string' ? e.label : undefined,
          type: e.type as 'default' | 'success' | 'failure' | undefined,
        })),
        created_by: 'current_user',
      };

      if (workflowId && workflow) {
        await updateWorkflow(workflowId, workflowData);
        toast({
          title: 'Success',
          description: 'Workflow saved successfully',
        });
      } else {
        const newWorkflow = await createWorkflow(workflowData);
        toast({
          title: 'Success',
          description: 'Workflow created successfully',
        });
        router.push(`/workflows/${newWorkflow.id}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    if (!workflowId) {
      toast({
        title: 'Error',
        description: 'Please save the workflow before running it',
        variant: 'destructive',
      });
      return;
    }

    setRunning(true);
    try {
      await createWorkflowExecution(workflowId, { manual: true });
      toast({
        title: 'Success',
        description: 'Workflow execution started',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start workflow execution',
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="sm" onClick={() => router.push('/workflows')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1 max-w-md">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Workflow name"
                className="font-semibold text-lg"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRun} disabled={running || !workflowId}>
              <Play className="h-4 w-4 mr-2" />
              Test Run
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
            <Panel position="top-left">
              <NodeToolbar onAddNode={(node) => setNodes((nds) => [...nds, node])} />
            </Panel>
          </ReactFlow>
        </div>

        <div className="w-96 border-l bg-white dark:bg-gray-900 overflow-y-auto">
          <Tabs defaultValue="properties" className="h-full">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="properties" className="flex-1">Properties</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="properties" className="p-4 space-y-4">
              {!selectedNode ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Workflow Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Workflow name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what this workflow does..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Node Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={selectedNode.data.label || ''}
                          onChange={(e) => {
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNode.id
                                  ? { ...n, data: { ...n.data, label: e.target.value } }
                                  : n
                              )
                            );
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={selectedNode.data.description || ''}
                          onChange={(e) => {
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNode.id
                                  ? { ...n, data: { ...n.data, description: e.target.value } }
                                  : n
                              )
                            );
                          }}
                          rows={3}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="p-0">
              {workflowId && <WorkflowExecutionHistory workflowId={workflowId} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
