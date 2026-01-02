# Notes App - Google Sheets Integration

A modern note-taking application built with Next.js 15, TypeScript, and Tailwind CSS that stores data in Google Sheets.

## Features

- ✨ **Modern UI**: Clean and responsive design with Tailwind CSS
- 📝 **CRUD Operations**: Create, read, update, and delete notes
- 🔍 **Search & Filter**: Search notes by title/content and filter by tags
- 🏷️ **Tag System**: Organize notes with custom tags
- 📱 **Responsive**: Works perfectly on desktop, tablet, and mobile
- 🚀 **Vercel Ready**: Optimized for deployment on Vercel
- 🔄 **Real-time**: Instant updates with React hooks

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Google Sheets (via Google Apps Script)
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── notes/
│   │       ├── route.ts          # GET /api/notes, POST /api/notes
│   │       └── [id]/
│   │           └── route.ts      # GET, PUT, DELETE /api/notes/[id]
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Main application page
├── components/
│   ├── NoteCard.tsx             # Individual note display component
│   └── NoteForm.tsx             # Create/edit note form
├── hooks/
│   └── useNotes.ts              # Custom hook for note operations
├── lib/
│   └── spreadsheet.ts           # Google Sheets service
└── types/
    └── note.ts                  # TypeScript type definitions
```

## Google Sheets Structure

The application expects your Google Sheets to have the following structure:

### Table Name: `Notes`

| Column | Type | Description | Required |
|--------|------|-------------|----------|
| `id` | String | Unique identifier for each note | Yes |
| `title` | String | Note title | Yes |
| `content` | Text | Note content | Yes |
| `createdAt` | DateTime | Creation timestamp | Yes |
| `updatedAt` | DateTime | Last update timestamp | Yes |
| `tags` | String | Comma-separated tags | No |
| `isArchived` | Boolean | Archive status | No |

### Example Data:
```
| id | title | content | createdAt | updatedAt | tags | isArchived |
|----|-------|---------|-----------|-----------|------|------------|
| note_1 | My First Note | This is my first note content | 2024-01-01T10:00:00Z | 2024-01-01T10:00:00Z | work,important | false |
| note_2 | Meeting Notes | Discussed project timeline | 2024-01-02T14:30:00Z | 2024-01-02T15:00:00Z | meeting,project | false |
```

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd practice-spreadsheet-database
npm install
```

### 2. Configure Google Sheets

1. **Create a Google Sheet** with the structure described above
2. **Set up Google Apps Script**:
   - Go to your Google Sheet
   - Click Extensions → Apps Script
   - Replace the default code with the following:

```javascript
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const notes = rows.map(row => {
    const note = {};
    headers.forEach((header, index) => {
      note[header] = row[index];
    });
    return note;
  });
  
  return ContentService
    .createTextOutput(JSON.stringify({ data: notes }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  
  // Add new note
  const newRow = [
    data.id || `note_${Date.now()}`,
    data.title,
    data.content,
    data.createdAt || new Date().toISOString(),
    data.updatedAt || new Date().toISOString(),
    data.tags ? data.tags.join(', ') : '',
    data.isArchived || false
  ];
  
  sheet.appendRow(newRow);
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. **Deploy the script**:
   - Click Deploy → New deployment
   - Choose "Web app"
   - Set access to "Anyone"
   - Copy the deployment URL

4. **Update the spreadsheet URL** in `src/lib/spreadsheet.ts`:
   ```typescript
   const SPREADSHEET_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
   ```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect Next.js and deploy

## API Endpoints

### GET /api/notes
Fetch all notes from the spreadsheet.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "note_1",
      "title": "My Note",
      "content": "Note content",
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z",
      "tags": ["work", "important"],
      "isArchived": false
    }
  ]
}
```

### POST /api/notes
Create a new note.

**Request Body:**
```json
{
  "title": "New Note",
  "content": "Note content",
  "tags": ["work", "important"]
}
```

### PUT /api/notes/[id]
Update an existing note.

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "tags": ["personal"],
  "isArchived": true
}
```

### DELETE /api/notes/[id]
Delete a note.

## Environment Variables

Create a `.env.local` file for any environment-specific configurations:

```env
# Add any environment variables here
NEXT_PUBLIC_APP_NAME=Notes App
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
