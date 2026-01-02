import { NextRequest, NextResponse } from 'next/server';
// Note: Using direct API calls instead of googleapis library for better compatibility
// import { google } from 'googleapis';
// const drive = google.drive('v3');

// Get OAuth2 access token from cookies or request headers
const getAccessToken = (request: NextRequest): string | null => {
  // Try to get from cookies first (for server-side)
  const token = request.cookies.get('google_access_token')?.value;
  if (token) return token;
  
  // Try to get from Authorization header (for client-side)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please connect your Google account.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;

    // Upload to Google Drive using direct API call
    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=media', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': file.type,
        'Content-Length': buffer.length.toString(),
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Google Drive API error: ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();

    // Update file metadata
    const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${uploadData.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: fileName,
      }),
    });

    if (!metadataResponse.ok) {
      throw new Error(`Failed to update file metadata: ${metadataResponse.status}`);
    }

    const response = await metadataResponse.json();

    if (!response.id) {
      throw new Error('Failed to upload file to Google Drive');
    }

    // Make the file publicly accessible
    const permissionResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${response.id}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    if (!permissionResponse.ok) {
      console.warn('Failed to make file public, but upload succeeded');
    }

    // Get the public URL
    const fileUrl = `https://drive.google.com/uc?id=${response.id}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: response.name,
      fileId: response.id,
    });

  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

