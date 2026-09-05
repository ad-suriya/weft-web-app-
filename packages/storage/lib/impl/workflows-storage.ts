import { request, mapApiWorkflow } from './backend-client.js';
import type { ApiWorkflow } from './backend-client.js';
import type { WorkflowSummary } from '@extension/types';

// Read-only: workflows are only ever created/edited on the dashboard. The
// extension just needs step ids/text to resolve a session's "current step"
// for the Current Work display and the relevance check.
// No single-workflow GET exists on the backend, so this fetches the list —
// fine at hackathon scale (a handful of workflows per user).
export const workflowsStorage = {
  listWorkflows: async (): Promise<WorkflowSummary[]> => {
    const workflows = await request<ApiWorkflow[]>('/workflows');
    return workflows.map(mapApiWorkflow);
  },
  getWorkflow: async (id: string): Promise<WorkflowSummary | undefined> => {
    const workflows = await workflowsStorage.listWorkflows();
    return workflows.find(w => w.id === id);
  },
};
