import { NextRequest, NextResponse } from 'next/server';
import { SpreadsheetService } from '@/lib/spreadsheet';
import { CreateNoteRequest } from '@/types/note';

export async function GET() {
  try {
    const spreadsheetService = SpreadsheetService.getInstance();
    const notes = await spreadsheetService.fetchNotes();

    return NextResponse.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error('Error in GET /api/notes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notes',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateNoteRequest = await request.json();
    
    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title and content are required',
        },
        { status: 400 }
      );
    }

    const spreadsheetService = SpreadsheetService.getInstance();
    const newNote = await spreadsheetService.createNote(body);

    if (!newNote) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create note',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newNote,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/notes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create note',
      },
      { status: 500 }
    );
  }
}
