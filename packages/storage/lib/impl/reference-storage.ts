import { request, mapApiReference } from './backend-client.js';
import type { ApiReference } from './backend-client.js';
import type { Reference, ReferenceCreateInput } from '@extension/types';

// The dashboard's Context screen already renders these (ReferencesCard) —
// this is the extension-side wiring for the popup's "Save Reference" button.
export const referenceStorage = {
  listReferences: async (taskId?: string): Promise<Reference[]> => {
    const path = taskId != null ? `/references?task_id=${encodeURIComponent(taskId)}` : '/references';
    const refs = await request<ApiReference[]>(path);
    return refs.map(mapApiReference);
  },
  addReference: async (input: ReferenceCreateInput): Promise<Reference> => {
    const created = await request<ApiReference>('/references', {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        url: input.url,
        task_id: input.taskId ? Number(input.taskId) : null,
        snippet: input.snippet,
      }),
    });
    return mapApiReference(created);
  },
  deleteReference: async (id: string): Promise<void> => {
    await request<{ deleted: number }>(`/references/${id}`, { method: 'DELETE' });
  },
};
