import { useState, useEffect, useCallback } from 'react';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '@/types/note';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/notes');
      const data = await response.json();
      
      if (data.success) {
        setNotes(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch notes');
      }
    } catch (err) {
      setError('Failed to fetch notes');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = useCallback(async (noteData: CreateNoteRequest): Promise<Note | null> => {
    setCreateLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotes(prev => [...prev, data.data]);
        return data.data;
      } else {
        setError(data.error || 'Failed to create note');
        return null;
      }
    } catch (err) {
      setError('Failed to create note');
      console.error('Error creating note:', err);
      return null;
    } finally {
      setCreateLoading(false);
    }
  }, []);

  const updateNote = useCallback(async (id: string, noteData: UpdateNoteRequest): Promise<Note | null> => {
    setUpdateLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotes(prev => prev.map(note => note.id === id ? data.data : note));
        return data.data;
      } else {
        setError(data.error || 'Failed to update note');
        return null;
      }
    } catch (err) {
      setError('Failed to update note');
      console.error('Error updating note:', err);
      return null;
    } finally {
      setUpdateLoading(false);
    }
  }, []);

  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    // Immediately remove from UI
    setNotes(prev => prev.filter(note => note.id !== id));
    
    setError(null);
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        return true;
      } else {
        // If delete failed, add the note back to UI
        setError(data.error || 'Failed to delete note');
        // You might want to refetch the notes here to restore the deleted note
        return false;
      }
    } catch (err) {
      setError('Failed to delete note');
      console.error('Error deleting note:', err);
      // You might want to refetch the notes here to restore the deleted note
      return false;
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    createLoading,
    updateLoading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    refreshData: fetchNotes, // Alias for consistency
  };
}
