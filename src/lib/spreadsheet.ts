import { Note, CreateNoteRequest, UpdateNoteRequest } from '@/types/note';

const SPREADSHEET_URL = process.env.NEXT_PUBLIC_SPREADSHEET_URL || '';

export class SpreadsheetService {
  private static instance: SpreadsheetService;
  private notes: Note[] = [];

  private constructor() {}

  public static getInstance(): SpreadsheetService {
    if (!SpreadsheetService.instance) {
      SpreadsheetService.instance = new SpreadsheetService();
    }
    return SpreadsheetService.instance;
  }

  async fetchNotes(): Promise<Note[]> {
    // Return sample data if no URL is configured (for development)
    if (!SPREADSHEET_URL || SPREADSHEET_URL.length < 10) {
      console.log('No valid spreadsheet URL configured, returning sample data');
      this.notes = [
        {
          id: 'sample_1',
          title: 'Sample Note',
          content: 'This is a sample note. Configure your Google Apps Script URL in .env.local to connect to your spreadsheet.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['sample', 'demo'],
          isArchived: false,
        }
      ];
      return this.notes;
    }

    try {
      const response = await fetch(SPREADSHEET_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        cache: 'no-store', // Disable caching for real-time data
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the data from spreadsheet format to Note format
      if (data.data && Array.isArray(data.data)) {
        this.notes = data.data.map((row: Record<string, unknown>, index: number) => ({
          id: row.id || `note_${index + 1}`,
          title: row.title || row.Name || 'Untitled',
          content: row.content || row.Text || '',
          createdAt: row.createdAt || new Date().toISOString(),
          updatedAt: row.updatedAt || new Date().toISOString(),
          tags: row.tags ? (typeof row.tags === 'string' ? row.tags.split(';').map((tag: string) => tag.trim()).filter(tag => tag.length > 0) : []) : [],
          attachments: row.attachments ? (typeof row.attachments === 'string' ? row.attachments.split(';').map((attachment: string) => attachment.trim()).filter(attachment => attachment.length > 0) : []) : [],
          isArchived: row.isArchived === 'true' || row.isArchived === true || false,
        }));
      }

      return this.notes;
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  }

  async createNote(noteData: CreateNoteRequest): Promise<Note | null> {
    try {
      // Convert tags string to array for frontend display
      const tagsArray = noteData.tags ? noteData.tags.split(';').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
      
      // Convert attachments string to array for frontend display
      const attachmentsArray = noteData.attachments ? noteData.attachments.split(';').map(attachment => attachment.trim()).filter(attachment => attachment.length > 0) : [];
      
      const newNote: Note = {
        id: `note_${Date.now()}`,
        title: noteData.title,
        content: noteData.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: tagsArray,
        attachments: attachmentsArray,
        isArchived: false,
      };

      // If no URL configured, just add to local cache for demo
      if (!SPREADSHEET_URL || SPREADSHEET_URL.length < 10) {
        console.log('No valid spreadsheet URL configured, adding to local cache only');
        this.notes.push(newNote);
        return newNote;
      }

      // Send POST request to Google Apps Script to create note
      const response = await fetch(SPREADSHEET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          data: newNote,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Apps Script response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const result = await response.json();
      console.log('Google Apps Script result:', result);
      
      if (result.success) {
        // Add to local cache
        this.notes.push(newNote);
        return newNote;
      } else {
        console.error('Failed to create note:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error creating note:', error);
      return null;
    }
  }

  async updateNote(id: string, noteData: UpdateNoteRequest): Promise<Note | null> {
    try {
      const noteIndex = this.notes.findIndex(note => note.id === id);
      if (noteIndex === -1) {
        return null;
      }

      // Convert tags string to array for frontend display
      const tagsArray = noteData.tags ? noteData.tags.split(';').map(tag => tag.trim()).filter(tag => tag.length > 0) : this.notes[noteIndex].tags;
      
      // Convert attachments string to array for frontend display
      const attachmentsArray = noteData.attachments ? noteData.attachments.split(';').map(attachment => attachment.trim()).filter(attachment => attachment.length > 0) : this.notes[noteIndex].attachments;
      
      const updatedNote = {
        ...this.notes[noteIndex],
        ...noteData,
        tags: tagsArray,
        attachments: attachmentsArray,
        updatedAt: new Date().toISOString(),
      };

      // Send PUT request to Google Apps Script to update note
      const response = await fetch(SPREADSHEET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          id: id,
          data: updatedNote,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local cache
        this.notes[noteIndex] = updatedNote;
        return updatedNote;
      } else {
        console.error('Failed to update note:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    }
  }

  async deleteNote(id: string): Promise<boolean> {
    try {
      const noteIndex = this.notes.findIndex(note => note.id === id);
      if (noteIndex === -1) {
        return false;
      }

      // Send DELETE request to Google Apps Script to delete note
      const response = await fetch(SPREADSHEET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          id: id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Remove from local cache
        this.notes.splice(noteIndex, 1);
        return true;
      } else {
        console.error('Failed to delete note:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }

  async getNoteById(id: string): Promise<Note | null> {
    try {
      const note = this.notes.find(note => note.id === id);
      return note || null;
    } catch (error) {
      console.error('Error getting note by id:', error);
      return null;
    }
  }

  // Method to refresh data from spreadsheet
  async refreshData(): Promise<Note[]> {
    this.notes = [];
    return await this.fetchNotes();
  }
}
