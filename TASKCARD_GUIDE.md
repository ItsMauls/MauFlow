# TaskCard dengan Attachment dan Comment - Panduan Lengkap

## 🎯 Overview

TaskCard telah berhasil diimplementasikan dengan fitur attachment dan comment yang lengkap. Sistem ini menyediakan:

- **File Attachment System**: Upload, preview, download, dan hapus file
- **Comment System**: Tambah, edit, hapus, dan lihat komentar
- **Visual Indicators**: Badge dan preview untuk task dengan enhancement
- **Persistent Storage**: Data tersimpan di localStorage
- **Responsive Design**: Optimal untuk desktop dan mobile

## 🚀 Cara Menjalankan

### 1. Start Development Server
```bash
cd frontend
npm run dev
```

### 2. Akses Demo
Buka browser dan kunjungi:
- **Demo Lengkap**: `http://localhost:3000/demo/task-card`
- **Dashboard Utama**: `http://localhost:3000`

## 📋 Komponen yang Tersedia

### TaskCardEnhanced
Komponen utama yang mengintegrasikan semua fitur:
```tsx
import { TaskCardEnhanced } from '@/components/tasks';

<TaskCardEnhanced
  task={task}
  onUpdate={handleUpdateTask}
  onDelete={handleDeleteTask}
  showEnhancements={true}
/>
```

### TaskCardDemo
Demo interaktif dengan multiple tasks:
- Lokasi: `frontend/src/components/tasks/TaskCardDemo.tsx`
- Route: `/demo/task-card`

### TaskCardExample
Contoh implementasi sederhana:
- Lokasi: `frontend/src/components/tasks/TaskCardExample.tsx`

## 🔧 Fitur Utama

### 📎 File Attachments
- **Drag & Drop**: Seret file ke area upload
- **File Types**: Mendukung gambar, dokumen, dan file umum
- **Size Limit**: Default 10MB per file
- **Preview**: Preview otomatis untuk gambar
- **Progress**: Indikator progress saat upload
- **Management**: Download dan hapus file

### 💬 Comment System
- **Add Comments**: Tambah komentar baru
- **Edit/Delete**: Edit dan hapus komentar existing
- **Real-time**: Update langsung tanpa refresh
- **Persistence**: Tersimpan di localStorage
- **Visual Feedback**: Loading states dan error handling

### 🎨 UI/UX Features
- **Expandable Sections**: Klik untuk expand/collapse
- **Visual Indicators**: Badge menunjukkan jumlah attachment/comment
- **Glass Morphism**: Efek visual modern
- **Responsive**: Optimal di semua ukuran layar
- **Animations**: Smooth transitions dan hover effects

## 📁 Struktur File

```
frontend/src/components/tasks/
├── TaskCard.tsx              # Base task card
├── TaskCardEnhanced.tsx      # Enhanced dengan attachment & comment
├── TaskCardDemo.tsx          # Demo lengkap
├── TaskCardExample.tsx       # Contoh sederhana
├── CommentSection.tsx        # Sistem komentar
├── FileAttachment.tsx        # Sistem attachment
├── AttachmentList.tsx        # List attachment
├── CommentList.tsx           # List komentar
├── CommentInput.tsx          # Input komentar
├── CommentItem.tsx           # Item komentar
├── FileUploadArea.tsx        # Area upload
├── AttachmentItem.tsx        # Item attachment
└── README.md                 # Dokumentasi detail
```

## 🎮 Cara Menggunakan Demo

### 1. Buka Demo Page
Navigasi ke `http://localhost:3000/demo/task-card`

### 2. Test File Attachments
- Klik bagian "Attachments" pada task card
- Drag & drop file atau klik area upload
- Lihat progress upload dan preview
- Test download dan hapus file

### 3. Test Comment System
- Klik bagian "Comments" pada task card
- Klik "Add a comment..." untuk menambah komentar
- Test edit dan hapus komentar
- Lihat visual indicators dan counters

### 4. Test Task Management
- Gunakan traffic light buttons (🔴🟡🟢) untuk manage task
- Ubah status dengan status selector
- Ubah priority dengan priority dots
- Test edit mode dengan double-click title

## 🔄 Integration dengan Aplikasi

### Basic Integration
```tsx
import { TaskCardEnhanced } from '@/components/tasks';

function MyTaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
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

### Advanced Integration
```tsx
// Dengan custom styling dan conditional features
<TaskCardEnhanced
  task={task}
  onUpdate={handleUpdateTask}
  onDelete={handleDeleteTask}
  showEnhancements={user.hasAdvancedFeatures}
  className="shadow-2xl hover:shadow-3xl"
/>
```

## 🛠 Customization

### File Upload Settings
```tsx
// Dalam FileAttachment component
<FileAttachment
  taskId={task.id}
  maxFileSize={5 * 1024 * 1024} // 5MB
  allowedFileTypes={['image/*', '.pdf', '.doc']}
  maxFiles={5}
/>
```

### Comment Settings
```tsx
// Dalam CommentSection component
<CommentSection
  taskId={task.id}
  maxLength={500}
  allowEdit={true}
  allowDelete={user.isOwner}
/>
```

## 📊 Data Storage

### localStorage Keys
- `mauflow_comments`: Semua komentar
- `mauflow_task_attachments`: Semua attachment

### Data Structure
```typescript
// Comments
{
  "mauflow_comments": [
    {
      "id": "comment-1",
      "taskId": "task-1",
      "content": "Great progress!",
      "author": "John Doe",
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ]
}

// Attachments
{
  "mauflow_task_attachments": [
    {
      "id": "att-1",
      "taskId": "task-1",
      "fileName": "design.png",
      "fileSize": 1024000,
      "fileType": "image/png",
      "downloadUrl": "blob:...",
      "uploadedAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

## 🧪 Testing

### Manual Testing
1. Upload berbagai tipe file
2. Test file size limits
3. Test comment CRUD operations
4. Test responsive design
5. Test error handling

### Automated Testing
```bash
npm run test
```

## 🚨 Troubleshooting

### File Upload Issues
- **File too large**: Periksa maxFileSize setting
- **Invalid file type**: Periksa allowedFileTypes
- **Upload failed**: Cek console untuk error details

### Comment Issues
- **Not saving**: Periksa localStorage availability
- **Empty content**: Validasi content tidak kosong
- **Permission denied**: Cek user permissions

### Performance Issues
- **Slow loading**: Batasi jumlah attachment/comment
- **Memory usage**: Clear old blob URLs
- **UI lag**: Optimize re-renders dengan React.memo

## 🔮 Next Steps

### Immediate Improvements
- [ ] Add file type icons
- [ ] Implement comment threading
- [ ] Add keyboard shortcuts
- [ ] Improve mobile UX

### Future Enhancements
- [ ] Backend integration
- [ ] Real-time collaboration
- [ ] File versioning
- [ ] Advanced search
- [ ] Notification system

## 📞 Support

Jika mengalami masalah:
1. Cek console browser untuk error
2. Periksa localStorage data
3. Test dengan browser berbeda
4. Restart development server

---

**TaskCard dengan Attachment dan Comment siap digunakan!** 🎉

Sistem ini menyediakan foundation yang solid untuk kolaborasi tim dengan fitur file sharing dan komunikasi yang terintegrasi langsung dalam task management.