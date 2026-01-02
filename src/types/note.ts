export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[]; // Display as array in frontend
  attachments?: string[]; // Display as array in frontend
  isArchived?: boolean;
}

// Internal interface for storage (string tags)
export interface NoteStorage {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string; // Store as semicolon-separated string
  attachments?: string; // Store as semicolon-separated string
  isArchived?: boolean;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  tags?: string; // Send as semicolon-separated string
  attachments?: string; // Send as semicolon-separated string
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  tags?: string; // Send as semicolon-separated string
  attachments?: string; // Send as semicolon-separated string
  isArchived?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type NotesResponse = ApiResponse<Note[]>;
export type NoteResponse = ApiResponse<Note>;
