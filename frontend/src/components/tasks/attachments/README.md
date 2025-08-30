# File Attachment System

This directory contains the complete file attachment system for MauFlow tasks, implementing drag-and-drop file uploads, file validation, and attachment management.

## Components

### FileAttachment
Main component that orchestrates the entire file attachment system.

**Features:**
- Expandable/collapsible interface
- File upload with progress tracking
- Attachment list display
- Error handling and validation feedback
- Integration with useAttachments hook

**Props:**
- `taskId`: ID of the task to attach files to
- `attachments`: Array of current attachments
- `onAttachmentAdd`: Callback for adding new attachments
- `onAttachmentRemove`: Callback for removing attachments
- `onAttachmentDownload`: Callback for downloading attachments
- `maxFileSize`: Maximum file size in bytes (default: 10MB)
- `allowedFileTypes`: Array of allowed MIME types
- `maxFiles`: Maximum number of files per task (default: 5)

### FileUploadArea
Drag-and-drop file upload interface with visual feedback.

**Features:**
- Drag-and-drop file selection
- Click to browse files
- Visual drag state feedback
- File type and size restrictions display
- Keyboard accessibility

### AttachmentList
Displays a list of attached files with actions.

**Features:**
- File information display (name, size, date)
- Download and remove actions
- File type icons
- Preview support for images and PDFs

### AttachmentItem
Individual attachment item with preview and actions.

**Features:**
- File type icon and metadata
- Preview modal for supported file types
- Download and remove actions
- Confirmation dialogs for destructive actions

## Hooks

### useAttachments
Custom hook for managing task attachments with persistence.

**Features:**
- Local storage persistence
- Optimistic updates
- Error handling
- File upload simulation
- Attachment CRUD operations

**Usage:**
```typescript
const {
  attachments,
  addAttachment,
  removeAttachment,
  downloadAttachment,
  isLoading,
  error
} = useAttachments(taskId);
```

## Utilities

### File Validation
- File size validation
- File type validation
- Multiple file validation
- Custom validation rules

### File Handling
- File upload simulation with progress
- File download handling
- File type categorization
- File size formatting
- Preview URL generation

## Types

### TaskAttachment
```typescript
interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  downloadUrl: string;
  previewUrl?: string;
}
```

### File Validation
```typescript
interface FileValidationResult {
  isValid: boolean;
  error?: string;
}
```

## Configuration

### Default Limits
- **Max file size**: 10MB
- **Max files per task**: 5
- **Allowed file types**: Images, PDFs, Documents, Spreadsheets, Archives, Text files

### Supported File Types
- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX
- **Spreadsheets**: XLS, XLSX
- **Archives**: ZIP
- **Text**: Plain text files

## Usage Examples

### Basic Usage
```typescript
import { FileAttachment } from '@/components/tasks';
import { useAttachments } from '@/hooks/useAttachments';

function TaskCard({ task }) {
  const {
    attachments,
    addAttachment,
    removeAttachment,
    downloadAttachment
  } = useAttachments(task.id);

  return (
    <div>
      {/* Task content */}
      <FileAttachment
        taskId={task.id}
        attachments={attachments}
        onAttachmentAdd={addAttachment}
        onAttachmentRemove={removeAttachment}
        onAttachmentDownload={downloadAttachment}
      />
    </div>
  );
}
```

### Custom Configuration
```typescript
<FileAttachment
  taskId={task.id}
  attachments={attachments}
  onAttachmentAdd={addAttachment}
  onAttachmentRemove={removeAttachment}
  onAttachmentDownload={downloadAttachment}
  maxFileSize={5 * 1024 * 1024} // 5MB
  maxFiles={3}
  allowedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
/>
```

### Demo Component
Use `FileAttachmentDemo` to test the system:

```typescript
import { FileAttachmentDemo } from '@/components/tasks';

function DemoPage() {
  return <FileAttachmentDemo />;
}
```

## Testing

The system includes comprehensive tests for:
- File validation logic
- File utility functions
- Upload simulation
- Error handling
- Component interactions

Run tests with:
```bash
npm test -- --testPathPattern=attachments.test.ts
```

## Security Considerations

### File Validation
- Strict file type checking using MIME types
- File size limits to prevent abuse
- File count limits per task

### File Storage
- Currently uses simulated upload with blob URLs
- In production, implement secure file storage
- Add virus scanning for uploaded files
- Implement proper access controls

### Data Persistence
- Uses localStorage for demo purposes
- In production, use secure server-side storage
- Implement proper user authentication
- Add file encryption for sensitive documents

## Performance Optimizations

### File Handling
- Lazy loading of file previews
- Blob URL cleanup to prevent memory leaks
- Progress tracking for large file uploads
- Optimistic updates for better UX

### Component Optimization
- React.memo for expensive components
- Debounced file validation
- Virtual scrolling for large attachment lists
- Image optimization for previews

## Accessibility

### Keyboard Navigation
- Full keyboard support for file selection
- Focus management in modals
- Screen reader friendly labels

### Visual Feedback
- High contrast mode support
- Clear visual states for drag-and-drop
- Progress indicators for uploads
- Error message announcements

## Browser Compatibility

### File API Support
- Modern browsers with File API support
- Drag-and-drop API support
- Blob URL support for previews

### Fallbacks
- Click-to-browse fallback for drag-and-drop
- Basic file input for unsupported browsers
- Progressive enhancement approach