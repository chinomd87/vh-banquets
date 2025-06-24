# File Upload Functionality for VH Banquets

## Overview

The VH Banquets application now supports file uploads for events, allowing you to attach PDFs, Word documents, images, and text files to any event. This is perfect for storing contracts, menus, floor plans, vendor agreements, and other important documents.

## Supported File Types

- **PDF files** (.pdf) - Contracts, menus, venue information
- **Word documents** (.doc, .docx) - Contracts, notes, planning documents
- **Text files** (.txt) - Notes, lists, simple documents
- **Images** (.jpg, .jpeg, .png) - Photos, floor plans, inspiration images

## File Size Limit

- Maximum file size: **10MB per file**
- No limit on the number of files per event

## How to Upload Files

### 1. Creating a New Event

1. Navigate to "Create Event" from the main menu
2. Fill out the event details (name, date, client info, etc.)
3. Scroll down to the "Files & Documents" section
4. **Upload Method 1: Drag & Drop**
   - Drag your files directly onto the upload area
   - Files will upload automatically
5. **Upload Method 2: Click to Browse**
   - Click the upload area
   - Select files from your computer
   - Multiple files can be selected at once

### 2. Editing an Existing Event

1. Open an existing event for editing
2. Scroll to the "Files & Documents" section
3. Existing files will be displayed
4. Upload new files using the same methods as above

## File Management Features

### Viewing Files

- **Preview**: Click the eye icon (👁) to view the file in a new browser tab
- **Download**: Click the download icon (⬇) to download the file to your computer
- **File Info**: Each file shows its name, size, type, and upload date

### Organizing Files

- Files are automatically sorted by upload date (newest first)
- File names are preserved exactly as uploaded
- File types are indicated with appropriate icons:
  - 📄 PDF files
  - 📝 Word documents  
  - 🖼 Images
  - 📄 Text files

### Deleting Files

- Click the trash icon (🗑) next to any file
- Confirm the deletion when prompted
- **Warning**: File deletion is permanent and cannot be undone

## Security Features

- Files are stored securely in Firebase Storage
- Only authenticated users can upload/access files
- Files are linked to specific events - only event owners can see them
- All file uploads are scanned for security

## Technical Details

### File Storage

- Files are stored in Firebase Storage under `events/{eventId}/files/`
- File metadata is stored in Firestore in the `eventFiles` collection
- Original filenames are preserved

### File Naming

- Uploaded files get a timestamp prefix to ensure uniqueness
- Format: `{timestamp}_{original_filename}`
- Display names show the original filename

### Upload Progress

- Real-time upload progress is shown for each file
- Large files will show a progress bar during upload
- Failed uploads will show an error message

## Best Practices

### File Organization

1. **Use descriptive filenames** before uploading
   - Good: "Wedding_Contract_Smith_2025.pdf"
   - Avoid: "document1.pdf"

2. **Organize by document type**
   - Contracts: Include client name and date
   - Menus: Include event type and version
   - Floor plans: Include venue and layout name

### File Formats

1. **For contracts**: Use PDF format for final versions
2. **For working documents**: Word documents are fine for drafts
3. **For images**: Use JPEG for photos, PNG for diagrams
4. **For notes**: Text files for simple lists and notes

### File Sizes

1. **Optimize images** before uploading to reduce file size
2. **Compress PDFs** if they're very large
3. **Consider splitting** very large documents into sections

## Troubleshooting

### Upload Failures

- **File too large**: Reduce file size or split into smaller files
- **Unsupported format**: Convert to a supported format (PDF, DOC, etc.)
- **Connection issues**: Check your internet connection and try again

### Missing Files

- Refresh the page to reload file list
- Check if you're viewing the correct event
- Verify you have permission to access the event

### Performance Issues

- Large files (>5MB) may take longer to upload
- Multiple simultaneous uploads may slow down performance
- Consider uploading files one at a time for better reliability

## Example Use Cases

### Wedding Events

- Upload signed contracts
- Store venue floor plans
- Save menu options and pricing
- Include vendor contact information
- Attach inspiration photos

### Corporate Events

- Store presentation materials
- Upload attendee lists
- Save catering menus
- Include setup instructions
- Attach contracts and agreements

### Private Parties

- Upload event timeline
- Store music playlists
- Save decoration photos
- Include special requests
- Attach payment receipts

## Future Enhancements

Planned improvements for file upload functionality:

- File versioning (keeping multiple versions of the same document)
- File sharing with clients through the client portal
- Automatic file organization by type
- File preview within the application
- Bulk file operations (download all, delete multiple)
- File templates for common documents

## Support

If you encounter any issues with file uploads:

1. Check the file format and size requirements
2. Verify your internet connection
3. Try uploading one file at a time
4. Clear your browser cache if problems persist
5. Contact support with specific error messages

The file upload system is designed to be robust and user-friendly, making it easy to keep all your event documents organized and accessible in one place.
