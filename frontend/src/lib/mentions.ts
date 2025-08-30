/**
 * Mention Parsing Utilities
 * Provides functionality for detecting, parsing, and formatting @mentions in comments
 */

import { MentionUser, MentionMatch, ParsedMention } from '@/types/comments';

// Regular expression to match @mentions
const MENTION_REGEX = /@(\w+)/g;
const MENTION_QUERY_REGEX = /@(\w*)$/;

/**
 * Parse mentions from comment content
 */
export const parseMentions = (content: string, users: MentionUser[]): ParsedMention[] => {
  const mentions: ParsedMention[] = [];
  const userMap = new Map(users.map(user => [user.name.toLowerCase().replace(/\s+/g, ''), user]));
  
  let match;
  const regex = new RegExp(MENTION_REGEX);
  
  while ((match = regex.exec(content)) !== null) {
    const mentionText = match[1].toLowerCase();
    const user = userMap.get(mentionText) || users.find(u => 
      u.name.toLowerCase().includes(mentionText) || 
      u.email?.toLowerCase().includes(mentionText)
    );
    
    if (user) {
      mentions.push({
        userId: user.id,
        userName: user.name,
        start: match.index,
        end: match.index + match[0].length
      });
    }
  }
  
  return mentions;
};

/**
 * Extract user IDs from mentions in content
 */
export const extractMentionIds = (content: string, users: MentionUser[]): string[] => {
  const mentions = parseMentions(content, users);
  return [...new Set(mentions.map(mention => mention.userId))];
};

/**
 * Find mention query at cursor position
 */
export const findMentionQuery = (content: string, cursorPosition: number): MentionMatch | null => {
  const beforeCursor = content.substring(0, cursorPosition);
  const match = beforeCursor.match(MENTION_QUERY_REGEX);
  
  if (match) {
    const start = match.index!;
    const query = match[1];
    
    return {
      start,
      end: cursorPosition,
      query
    };
  }
  
  return null;
};

/**
 * Filter users based on mention query
 */
export const filterUsersForMention = (users: MentionUser[], query: string): MentionUser[] => {
  if (!query.trim()) {
    return users.slice(0, 10); // Show first 10 users when no query
  }
  
  const lowercaseQuery = query.toLowerCase();
  
  return users
    .filter(user => 
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email?.toLowerCase().includes(lowercaseQuery) ||
      user.role?.toLowerCase().includes(lowercaseQuery)
    )
    .sort((a, b) => {
      // Prioritize exact name matches
      const aNameMatch = a.name.toLowerCase().startsWith(lowercaseQuery);
      const bNameMatch = b.name.toLowerCase().startsWith(lowercaseQuery);
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      // Then sort alphabetically
      return a.name.localeCompare(b.name);
    })
    .slice(0, 10); // Limit to 10 results
};

/**
 * Replace mention query with selected user
 */
export const replaceMentionQuery = (
  content: string,
  mentionMatch: MentionMatch,
  selectedUser: MentionUser
): { content: string; cursorPosition: number } => {
  const mentionText = `@${selectedUser.name.replace(/\s+/g, '')}`;
  const beforeMention = content.substring(0, mentionMatch.start);
  const afterMention = content.substring(mentionMatch.end);
  
  const newContent = beforeMention + mentionText + ' ' + afterMention;
  const newCursorPosition = mentionMatch.start + mentionText.length + 1;
  
  return {
    content: newContent,
    cursorPosition: newCursorPosition
  };
};

/**
 * Format content with clickable mentions for display
 */
export const formatMentionsForDisplay = (content: string, users: MentionUser[]): string => {
  const mentions = parseMentions(content, users);
  
  if (mentions.length === 0) {
    return content;
  }
  
  // Sort mentions by position (reverse order to maintain indices)
  const sortedMentions = mentions.sort((a, b) => b.start - a.start);
  
  let formattedContent = content;
  
  for (const mention of sortedMentions) {
    const beforeMention = formattedContent.substring(0, mention.start);
    const afterMention = formattedContent.substring(mention.end);
    const mentionHtml = `<span class="mention" data-user-id="${mention.userId}">@${mention.userName}</span>`;
    
    formattedContent = beforeMention + mentionHtml + afterMention;
  }
  
  return formattedContent;
};

/**
 * Validate mention syntax
 */
export const validateMentions = (content: string, users: MentionUser[]): {
  isValid: boolean;
  invalidMentions: string[];
} => {
  const mentions = parseMentions(content, users);
  const mentionTexts = content.match(MENTION_REGEX) || [];
  const validMentionTexts = mentions.map(m => `@${m.userName.replace(/\s+/g, '')}`);
  
  const invalidMentions = mentionTexts.filter(mention => 
    !validMentionTexts.some(valid => 
      valid.toLowerCase() === mention.toLowerCase()
    )
  );
  
  return {
    isValid: invalidMentions.length === 0,
    invalidMentions
  };
};

/**
 * Get mention statistics
 */
export const getMentionStats = (content: string, users: MentionUser[]) => {
  const mentions = parseMentions(content, users);
  const uniqueUsers = [...new Set(mentions.map(m => m.userId))];
  
  return {
    totalMentions: mentions.length,
    uniqueUsers: uniqueUsers.length,
    mentionedUsers: uniqueUsers.map(userId => 
      users.find(u => u.id === userId)
    ).filter(Boolean) as MentionUser[]
  };
};

/**
 * Sanitize mention content for safe storage
 */
export const sanitizeMentionContent = (content: string): string => {
  // Remove any HTML tags that might have been injected
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

/**
 * Convert user names to mention format for autocomplete
 */
export const userToMentionText = (user: MentionUser): string => {
  return user.name.replace(/\s+/g, '');
};

/**
 * Check if cursor is within a mention
 */
export const isCursorInMention = (content: string, cursorPosition: number, users: MentionUser[]): boolean => {
  const mentions = parseMentions(content, users);
  
  return mentions.some(mention => 
    cursorPosition >= mention.start && cursorPosition <= mention.end
  );
};