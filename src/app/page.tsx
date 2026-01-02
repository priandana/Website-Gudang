'use client';

import { useState } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '@/types/note';
import NoteCard from '@/components/NoteCard';
import NoteForm from '@/components/NoteForm';

export default function Home() {
  const { notes, loading, createLoading, updateLoading, error, createNote, updateNote, deleteNote } = useNotes();
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const handleSubmit = async (data: CreateNoteRequest | UpdateNoteRequest) => {
    if (editingNote) {
      // Handle edit
      const result = await updateNote(editingNote.id, data as UpdateNoteRequest);
      if (result) {
        setEditingNote(null);
      }
    } else {
      // Handle create
      const result = await createNote(data as CreateNoteRequest);
      if (result) {
        setShowForm(false);
      }
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await deleteNote(id);
    }
  };

  const handleEditClick = (note: Note) => {
    setEditingNote(note);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingNote(null);
  };

  // Get unique tags from all notes
  const allTags = Array.from(
    new Set(notes.flatMap(note => note.tags || []))
  ).sort();

  // Filter notes based on search term and selected tag
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || (note.tags && note.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Notes</h1>
          <p className="text-gray-600">Organize your thoughts and ideas</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Note</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading notes...</span>
          </div>
        )}

        {/* Notes Grid */}
        {!loading && (
          <>
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {notes.length === 0 ? 'No notes yet' : 'No notes found'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {notes.length === 0 
                    ? 'Create your first note to get started!' 
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {notes.length === 0 && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Create Your First Note
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Note Form Modal */}
        {(showForm || editingNote) && (
          <NoteForm
            note={editingNote || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
            loading={editingNote ? updateLoading : createLoading}
          />
        )}
      </div>
    </div>
  );
}
