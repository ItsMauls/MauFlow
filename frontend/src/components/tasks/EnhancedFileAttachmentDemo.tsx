/**
 * Enhanced File Attachment Demo
 * Demonstrates the enhanced file attachment features including preview, secure downloads, and progress tracking
 */

'use client';

import React, { useState } from 'react';
import { FileAttachment } from './FileAttachment';
import { TaskAttachment } from '@/types/attachments';

const DEMO_ATTACHMENTS: TaskAttachment[] = [
  {
    id: 'demo-1',
    taskId: 'demo-task',
    fileName: 'project-mockup.jpg',
    fileSize: 2048576, // 2MB
    fileType: 'image/jpeg',
    uploadedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    downloadUrl: 'https://picsum.photos/800/600?random=1',
    previewUrl: 'https://picsum.photos/800/600?random=1',
    thumbnailUrl: 'https://picsum.photos/150/150?random=1',
    isSecure: true,
    downloadCount: 3
  },
  {
    id: 'demo-2',
    taskId: 'demo-task',
    fileName: 'requirements.txt',
    fileSize: 1024, // 1KB
    fileType: 'text/plain',
    uploadedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    downloadUrl: 'data:text/plain;base64,UHJvamVjdCBSZXF1aXJlbWVudHMKLS0tLS0tLS0tLS0tLS0tLS0tCgoxLiBVc2VyIEF1dGhlbnRpY2F0aW9uCjIuIERhdGEgVmFsaWRhdGlvbgozLiBGaWxlIFVwbG9hZAo0LiBSZXNwb25zaXZlIERlc2lnbgo1LiBBY2Nlc3NpYmlsaXR5IENvbXBsaWFuY2U=',
    isSecure: false,
    downloadCount: 1
  },
  {
    id: 'demo-3',
    taskId: 'demo-task',
    fileName: 'presentation.pdf',
    fileSize: 5242880, // 5MB
    fileType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    isSecure: true,
    downloadCount: 0
  },
  {
    id: 'demo-4',
    taskId: 'demo-task',
    fileName: 'demo-video.mp4',
    fileSize: 10485760, // 10MB
    fileType: 'video/mp4',
    uploadedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    downloadUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    isSecure: true,
    downloadCount: 2
  }
];

export const EnhancedFileAttachmentDemo: React.FC = () => {
  const [attachments, setAttachments] = useState<TaskAttachment[]>(DEMO_ATTACHMENTS);
  const [uploadCount, setUploadCount] = useState(0);

  const handleAttachmentAdd = async (taskId: string, file: File) => {
    // Simulate adding new attachment
    const newAttachment: TaskAttachment = {
      id: `demo-new-${Date.now()}`,
      taskId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      downloadUrl: URL.createObjectURL(file),
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      isSecure: true,
      downloadCount: 0
    };

    setAttachments(prev => [...prev, newAttachment]);
    setUploadCount(prev => prev + 1);
  };

  const handleAttachmentRemove = async (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleAttachmentDownload = (attachment: TaskAttachment) => {
    // Update download count
    setAttachments(prev => 
      prev.map(att => 
        att.id === attachment.id 
          ? { ...att, downloadCount: (att.downloadCount || 0) + 1 }
          : att
      )
    );
    console.log('Downloaded:', attachment.fileName);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-white">
          Enhanced File Attachment System
        </h1>
        <p className="text-white/70 max-w-2xl mx-auto">
          Demonstration of enhanced file attachment features including file preview, 
          secure downloads, progress tracking, and support for multiple file types.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
          <div className="text-2xl mb-2">🖼️</div>
          <h3 className="font-semibold text-white mb-1">Enhanced Preview</h3>
          <p className="text-sm text-white/70">
            Support for images, PDFs, text files, videos, and audio
          </p>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
          <div className="text-2xl mb-2">🔒</div>
          <h3 className="font-semibold text-white mb-1">Secure Downloads</h3>
          <p className="text-sm text-white/70">
            Token-based secure URLs with expiration
          </p>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold text-white mb-1">Progress Tracking</h3>
          <p className="text-sm text-white/70">
            Detailed upload progress with speed and time estimates
          </p>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
          <div className="text-2xl mb-2">🎯</div>
          <h3 className="font-semibold text-white mb-1">Error Handling</h3>
          <p className="text-sm text-white/70">
            Comprehensive error handling with retry capabilities
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white mb-1">Demo Statistics</h3>
            <p className="text-sm text-white/70">
              Current attachments: {attachments.length} • Files uploaded in demo: {uploadCount}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-300">
              {attachments.reduce((sum, att) => sum + (att.downloadCount || 0), 0)}
            </div>
            <div className="text-xs text-white/60">Total Downloads</div>
          </div>
        </div>
      </div>

      {/* File Attachment Component */}
      <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/20">
        <h2 className="text-xl font-semibold text-white mb-4">
          Interactive File Attachment Demo
        </h2>
        
        <FileAttachment
          taskId="demo-task"
          attachments={attachments}
          onAttachmentAdd={handleAttachmentAdd}
          onAttachmentRemove={handleAttachmentRemove}
          onAttachmentDownload={handleAttachmentDownload}
          maxFileSize={50 * 1024 * 1024} // 50MB for demo
          maxFiles={10}
        />
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/10 rounded-lg p-4 backdrop-blur-sm border border-blue-400/30">
        <h3 className="font-semibold text-blue-300 mb-2">Try These Features:</h3>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Click the preview button (👁️) on any attachment to see enhanced preview</li>
          <li>• Upload new files to see the enhanced progress indicators</li>
          <li>• Download files to see secure download handling</li>
          <li>• Try uploading different file types (images, text, PDFs, videos)</li>
          <li>• Notice the thumbnails for image files and security indicators</li>
        </ul>
      </div>
    </div>
  );
};