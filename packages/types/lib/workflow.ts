// Minimal projection of a dashboard Workflow — just enough for the extension
// to resolve "which step is a task/session currently on" and its text, for
// the relevance check and the popup's Current Work display. The full
// workflow model (trigger, sop_text, etc.) only exists on the dashboard.
export interface WorkflowStepSummary {
  id: string;
  taskName: string;
  estimatedMinutes: number;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  steps: WorkflowStepSummary[];
}
