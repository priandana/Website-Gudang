import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const spreadsheetUrl = process.env.NEXT_PUBLIC_SPREADSHEET_URL;
    
    return NextResponse.json({
      success: true,
      data: {
        hasSpreadsheetUrl: !!spreadsheetUrl,
        spreadsheetUrlLength: spreadsheetUrl?.length || 0,
        nodeVersion: process.version,
        env: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
