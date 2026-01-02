import { NextRequest, NextResponse } from 'next/server';
import { SpreadsheetService } from '@/lib/spreadsheet';
import { UpdateNoteRequest } from '@/types/note';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const spreadsheetService = SpreadsheetService.getInstance();
    const note = await spreadsheetService.getNoteById(id);

    if (!note) {
      return NextResponse.json(
        {
          success: false,
          error: 'Note not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error('Error in GET /api/notes/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch note',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body: UpdateNoteRequest = await request.json();

    const spreadsheetService = SpreadsheetService.getInstance();
    const updatedNote = await spreadsheetService.updateNote(id, body);

    if (!updatedNote) {
      return NextResponse.json(
        {
          success: false,
          error: 'Note not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedNote,
    });
  } catch (error) {
    console.error('Error in PUT /api/notes/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update note',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const spreadsheetService = SpreadsheetService.getInstance();
    const success = await spreadsheetService.deleteNote(id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Note not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/notes/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete note',
      },
      { status: 500 }
    );
  }
}
