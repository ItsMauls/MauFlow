/**
 * Task Comment System Types
 * Defines interfaces and types for the task comment functionality
 */

export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
  mentions?: string[]; // Array of user IDs mentioned in the comment
  authorId?: string; // ID of the comment author
}

export interface CommentFormData {
  content: string;
}

export interface CommentSectionProps {
  taskId: string;
  comments: TaskComment[];
  onAddComment: (taskId: string, content: string) => void;
  onEditComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  className?: string;
}

export interface CommentInputProps {
  onSubmit: (content: string, mentions?: string[]) => Promise<void> | void;
  placeholder?: string;
  initialValue?: string;
  isEditing?: boolean;
  onCancel?: () => void;
  className?: string;
  disabled?: boolean;
  enableMentions?: boolean;
}

export interface CommentListProps {
  comments: TaskComment[];
  onEdit: (commentId: string, content: string) => Promise<void> | void;
  onDelete: (commentId: string) => Promise<void> | void;
  className?: string;
}

export interface CommentItemProps {
  comment: TaskComment;
  onEdit: (commentId: string, content: string, mentions?: string[]) => Promise<void> | void;
  onDelete: (commentId: string) => Promise<void> | void;
  className?: string;
}

// Mention-related interfaces
export interface MentionUser {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  email?: string;
}

export interface MentionDropdownProps {
  users: MentionUser[];
  onSelect: (user: MentionUser) => void;
  onClose: () => void;
  position: { top: number; left: number };
  query: string;
  className?: string;
}

export interface MentionMatch {
  start: number;
  end: number;
  query: string;
  userId?: string;
}

export interface ParsedMention {
  userId: string;
  userName: string;
  start: number;
  end: number;
}