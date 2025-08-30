'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { AttachmentItemProps } from '@/types/attachments';
import { 
  formatFileSize, 
  getFileTypeIcon, 
  generatePreviewUrl, 
  supportsPreview,
  getPreviewType,
  downloadAttachment as downloadAttachmentUtil,
  readTextFileContent
} from '@/lib/attachments';

/**
 * Individual attachment item component with preview and actions
 */
export const AttachmentItem: React.FC<AttachmentItemProps> = ({
  attachment,
  onRemove,
  onDownload,
  onPreview,
  className
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handleRemove = async () => {
    if (isRemoving) return;
    
    if (confirm(`Are you sure you want to remove "${attachment.fileName}"?`)) {
      setIsRemoving(true);
      try {
        await onRemove(attachment.id);
      } catch (error) {
        console.error('Failed to remove attachment:', error);
        setIsRemoving(false);
      }
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      await downloadAttachmentUtil(attachment);
      onDownload(attachment); // Call parent handler for tracking
    } catch (error) {
      console.error('Download failed:', error);
      alert(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = async () => {
    if (!supportsPreview(attachment.fileType)) return;
    
    setPreviewError(null);
    setPreviewContent(null);
    
    // Load text content for text files
    const previewType = getPreviewType(attachment.fileType);
    if (previewType === 'text') {
      try {
        const content = await readTextFileContent(attachment);
        setPreviewContent(content);
      } catch (error) {
        setPreviewError(error instanceof Error ? error.message : 'Failed to load file content');
      }
    }
    
    setShowPreview(true);
    onPreview?.(attachment); // Call parent handler for tracking
  };

  const previewUrl = generatePreviewUrl(attachment);
  const canPreview = supportsPreview(attachment.fileType);

  return (
    <>
      <div className={cn(
        'flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-200',
        isRemoving && 'opacity-50 pointer-events-none',
        className
      )}>
        {/* File icon/thumbnail */}
        <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center overflow-hidden">
          {attachment.thumbnailUrl ? (
            <img
              src={attachment.thumbnailUrl}
              alt={attachment.fileName}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-lg">
              {getFileTypeIcon(attachment.fileType)}
            </span>
          )}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="text-sm font-medium text-white/90 truncate">
              {attachment.fileName}
            </h5>
            {canPreview && (
              <button
                onClick={handlePreview}
                className="text-xs text-blue-300 hover:text-blue-200 transition-colors"
                title="Preview file"
              >
                👁️
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-white/60">
            <span>{formatFileSize(attachment.fileSize)}</span>
            <span>•</span>
            <span>
              {new Date(attachment.uploadedAt).toLocaleDateString()}
            </span>
            {attachment.isSecure && (
              <>
                <span>•</span>
                <span className="text-green-400 flex items-center gap-1">
                  🔒 Secure
                </span>
              </>
            )}
            {attachment.downloadCount !== undefined && attachment.downloadCount > 0 && (
              <>
                <span>•</span>
                <span>{attachment.downloadCount} downloads</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isDownloading ? "Downloading..." : "Download file"}
          >
            <span className="text-sm">
              {isDownloading ? '⏳' : '⬇️'}
            </span>
          </button>

          {/* Remove button */}
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="p-2 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-all duration-200 disabled:opacity-50"
            title="Remove file"
          >
            <span className="text-sm">
              {isRemoving ? '⏳' : '🗑️'}
            </span>
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white/10 rounded-xl border border-white/20 backdrop-blur-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <h3 className="text-lg font-medium text-white truncate">
                {attachment.fileName}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                ✕
              </button>
            </div>

            {/* Enhanced Preview content */}
            <div className="p-4 max-h-[70vh] overflow-auto">
              {previewError ? (
                <div className="text-center py-8 text-red-300">
                  <span className="text-4xl mb-4 block">❌</span>
                  <p className="mb-2">Failed to load preview</p>
                  <p className="text-sm text-red-400">{previewError}</p>
                </div>
              ) : (
                <>
                  {getPreviewType(attachment.fileType) === 'image' && previewUrl && (
                    <div className="text-center">
                      <img
                        src={previewUrl}
                        alt={attachment.fileName}
                        className="max-w-full max-h-[60vh] object-contain mx-auto rounded-lg shadow-lg"
                        onError={() => setPreviewError('Failed to load image')}
                      />
                    </div>
                  )}
                  
                  {getPreviewType(attachment.fileType) === 'pdf' && previewUrl && (
                    <iframe
                      src={previewUrl}
                      className="w-full h-[60vh] rounded-lg border border-white/20"
                      title={attachment.fileName}
                      onError={() => setPreviewError('Failed to load PDF')}
                    />
                  )}
                  
                  {getPreviewType(attachment.fileType) === 'text' && (
                    <div className="bg-black/40 rounded-lg p-4 font-mono text-sm">
                      {previewContent ? (
                        <pre className="whitespace-pre-wrap text-white/90 max-h-[50vh] overflow-auto">
                          {previewContent}
                        </pre>
                      ) : (
                        <div className="text-center py-4 text-white/60">
                          <span className="text-2xl mb-2 block">⏳</span>
                          <p>Loading file content...</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {getPreviewType(attachment.fileType) === 'video' && previewUrl && (
                    <video
                      src={previewUrl}
                      controls
                      className="max-w-full max-h-[60vh] mx-auto rounded-lg"
                      onError={() => setPreviewError('Failed to load video')}
                    >
                      Your browser does not support video playback.
                    </video>
                  )}
                  
                  {getPreviewType(attachment.fileType) === 'audio' && previewUrl && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🎵</div>
                      <audio
                        src={previewUrl}
                        controls
                        className="mx-auto"
                        onError={() => setPreviewError('Failed to load audio')}
                      >
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  )}
                  
                  {getPreviewType(attachment.fileType) === 'none' && (
                    <div className="text-center py-8 text-white/60">
                      <span className="text-4xl mb-4 block">📄</span>
                      <p className="mb-2">Preview not available for this file type</p>
                      <p className="text-sm text-white/50">
                        File type: {attachment.fileType}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Enhanced Preview actions */}
            <div className="flex items-center justify-between p-4 border-t border-white/20">
              <div className="text-xs text-white/60">
                {formatFileSize(attachment.fileSize)} • {attachment.fileType}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-lg hover:bg-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? 'Downloading...' : 'Download'}
                </button>
                
                {previewError && (
                  <button
                    onClick={() => {
                      setPreviewError(null);
                      handlePreview();
                    }}
                    className="px-4 py-2 bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 rounded-lg hover:bg-yellow-500/30 transition-all duration-200"
                  >
                    Retry
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewContent(null);
                    setPreviewError(null);
                  }}
                  className="px-4 py-2 bg-white/10 text-white/80 border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};