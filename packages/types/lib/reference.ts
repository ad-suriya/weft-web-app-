// A page the user explicitly saved against a task — title + URL + an
// optional short user-selected snippet. Never raw page HTML/text; see
// dashboard/backend/privacy.py's enforce_metadata_only, which every
// reference create routes through server-side.
export interface Reference {
  id: string;
  title: string;
  url?: string;
  taskId?: string;
  snippet?: string;
  createdAt: number;
}

export interface ReferenceCreateInput {
  title: string;
  url?: string;
  taskId?: string;
  snippet?: string;
}
