'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AttachmentListProps } from '@/types/attachments';
import { AttachmentItem } from './AttachmentItem';

/**
 * List component for displaying task attachments
 */
export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  onRemove,
  onDownload,
  className
}) => {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="text-sm font-medium text-white/80 mb-3">
        Attached Files ({attachments.length})
      </h4>
      
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <AttachmentItem
            key={attachment.id}
            attachment={attachment}
            onRemove={onRemove}
            onDownload={onDownload}
          />
        ))}
      </div>
    </div>
  );
};