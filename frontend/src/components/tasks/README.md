# TaskCard dengan Attachment dan Comment

Komponen TaskCard yang telah ditingkatkan dengan fitur file attachment dan sistem komentar untuk meningkatkan kolaborasi tim.

## Komponen Utama

### TaskCardEnhanced
Komponen utama yang mengintegrasikan TaskCard dengan fitur attachment dan comment.

```tsx
import { TaskCardEnhanced } from '@/components/tasks';

<TaskCardEnhanced
  task={task}
  onUpdate={handleUpdateTask}
  onDelete={handleDeleteTask}
  showEnhancements={true}
/>
```

### Fitur Utama

#### 📎 File Attachments
- **Drag & Drop Upload**: Seret file langsung ke area upload
- **File Validation**: Validasi tipe dan ukuran file otomatis
- **Preview Support**: Preview untuk gambar dan dokumen
- **Progress Tracking**: Indikator progress saat upload
- **Download & Remove**: Unduh atau hapus attachment
- **Storage**: Persistent storage menggunakan localStorage

#### 💬 Comment System
- **Real-time Comments**: Sistem komentar real-time
- **Edit & Delete**: Edit dan hapus komentar
- **Optimistic Updates**: Update optimis untuk UX yang lebih baik
- **Visual Indicators**: Badge dan preview untuk komentar
- **Persistent Storage**: Penyimpanan permanen di localStorage

#### 🎨 Visual Enhancements
- **Expandable Sections**: Bagian yang dapat diperluas/diciutkan
- **Visual Indicators**: Badge untuk task dengan attachment/comment
- **Responsive Design**: Desain responsif untuk mobile dan desktop
- **Glass Morphism**: Efek visual modern dengan backdrop blur

## Struktur Data

### Task Interface
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  aiScore?: number;
  projectId?: string;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
}
```

### TaskAttachment Interface
```typescript
interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
  previewUrl?: string;
  uploadedAt: string;
  downloadCount?: number;
}
```

### TaskComment Interface
```typescript
interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
}
```

## Hooks yang Digunakan

### useAttachments
Hook untuk mengelola file attachment dengan persistent storage.

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

### useComments
Hook untuk mengelola sistem komentar dengan optimistic updates.

```typescript
const {
  comments,
  isLoading,
  error,
  addComment,
  editComment,
  deleteComment,
  clearError,
  refetch
} = useComments(taskId);
```

## Contoh Penggunaan

### Basic Usage
```tsx
import { TaskCardEnhanced } from '@/components/tasks';

function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <TaskCardEnhanced
          key={task.id}
          task={task}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          showEnhancements={true}
        />
      ))}
    </div>
  );
}
```

### Advanced Usage dengan Custom Styling
```tsx
<TaskCardEnhanced
  task={task}
  onUpdate={handleUpdateTask}
  onDelete={handleDeleteTask}
  showEnhancements={true}
  className="shadow-2xl hover:shadow-3xl transition-shadow"
/>
```

## Demo dan Testing

### TaskCardDemo
Komponen demo lengkap yang menunjukkan semua fitur:
- Akses melalui `/demo/task-card`
- Menampilkan multiple tasks dengan berbagai status
- Interactive features untuk testing

### TaskCardExample
Contoh implementasi sederhana:
- Fokus pada satu task
- Menunjukkan integrasi dasar
- Cocok untuk pembelajaran

## File Structure
```
components/tasks/
├── TaskCard.tsx              # Komponen dasar task card
├── TaskCardEnhanced.tsx      # Enhanced version dengan attachment & comment
├── TaskCardDemo.tsx          # Demo lengkap
├── TaskCardExample.tsx       # Contoh sederhana
├── CommentSection.tsx        # Sistem komentar
├── FileAttachment.tsx        # Sistem attachment
├── AttachmentList.tsx        # List attachment
├── CommentList.tsx           # List komentar
└── index.ts                  # Export semua komponen
```

## Best Practices

1. **Performance**: Gunakan `showEnhancements={false}` jika tidak memerlukan fitur attachment/comment
2. **Storage**: Data disimpan di localStorage, pertimbangkan migrasi ke backend untuk production
3. **File Size**: Set batas ukuran file yang sesuai dengan kebutuhan
4. **Error Handling**: Selalu handle error dari hooks untuk UX yang baik
5. **Accessibility**: Komponen sudah include ARIA labels dan keyboard navigation

## Troubleshooting

### File Upload Gagal
- Periksa ukuran file (default max 10MB)
- Pastikan tipe file didukung
- Cek storage browser tidak penuh

### Comment Tidak Tersimpan
- Periksa localStorage browser
- Pastikan content comment tidak kosong
- Cek console untuk error

### Performance Issues
- Batasi jumlah attachment per task
- Gunakan lazy loading untuk preview
- Pertimbangkan pagination untuk comment

## Roadmap

- [ ] Integration dengan backend API
- [ ] Real-time collaboration
- [ ] File versioning
- [ ] Comment threading
- [ ] Notification system
- [ ] Advanced file preview
- [ ] Bulk operations