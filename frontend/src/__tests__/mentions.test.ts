/**
 * Unit Tests for Mention Functionality
 * Tests mention parsing, filtering, and formatting utilities
 */

import {
  parseMentions,
  extractMentionIds,
  findMentionQuery,
  filterUsersForMention,
  replaceMentionQuery,
  formatMentionsForDisplay,
  validateMentions,
  getMentionStats,
  sanitizeMentionContent,
  userToMentionText,
  isCursorInMention
} from '@/lib/mentions';
import { MentionUser } from '@/types/comments';

// Mock users for testing
const mockUsers: MentionUser[] = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    avatar: '👩‍💼',
    role: 'Project Manager',
    email: 'alice@company.com'
  },
  {
    id: 'user-2',
    name: 'Bob Smith',
    avatar: '👨‍💻',
    role: 'Developer',
    email: 'bob@company.com'
  },
  {
    id: 'user-3',
    name: 'Carol Davis',
    avatar: '👩‍💻',
    role: 'Designer',
    email: 'carol@company.com'
  }
];

describe('Mention Parsing', () => {
  describe('parseMentions', () => {
    it('should parse simple mentions', () => {
      const content = 'Hey @AliceJohnson, can you review this?';
      const mentions = parseMentions(content, mockUsers);
      
      expect(mentions).toHaveLength(1);
      expect(mentions[0]).toEqual({
        userId: 'user-1',
        userName: 'Alice Johnson',
        start: 4,
        end: 17
      });
    });

    it('should parse multiple mentions', () => {
      const content = '@AliceJohnson and @BobSmith please check this';
      const mentions = parseMentions(content, mockUsers);
      
      expect(mentions).toHaveLength(2);
      expect(mentions[0].userId).toBe('user-1');
      expect(mentions[1].userId).toBe('user-2');
    });

    it('should handle mentions with partial matches', () => {
      const content = 'Hey @Alice, what do you think?';
      const mentions = parseMentions(content, mockUsers);
      
      expect(mentions).toHaveLength(1);
      expect(mentions[0].userId).toBe('user-1');
    });

    it('should return empty array for no mentions', () => {
      const content = 'This is a regular comment without mentions';
      const mentions = parseMentions(content, mockUsers);
      
      expect(mentions).toHaveLength(0);
    });

    it('should handle invalid mentions', () => {
      const content = 'Hey @NonExistentUser, are you there?';
      const mentions = parseMentions(content, mockUsers);
      
      expect(mentions).toHaveLength(0);
    });
  });

  describe('extractMentionIds', () => {
    it('should extract user IDs from mentions', () => {
      const content = '@AliceJohnson and @BobSmith please review';
      const ids = extractMentionIds(content, mockUsers);
      
      expect(ids).toEqual(['user-1', 'user-2']);
    });

    it('should deduplicate user IDs', () => {
      const content = '@AliceJohnson and @AliceJohnson again';
      const ids = extractMentionIds(content, mockUsers);
      
      expect(ids).toEqual(['user-1']);
    });

    it('should return empty array for no mentions', () => {
      const content = 'No mentions here';
      const ids = extractMentionIds(content, mockUsers);
      
      expect(ids).toEqual([]);
    });
  });
});

describe('Mention Query Detection', () => {
  describe('findMentionQuery', () => {
    it('should find mention query at cursor position', () => {
      const content = 'Hey @Ali';
      const cursorPosition = 8;
      const match = findMentionQuery(content, cursorPosition);
      
      expect(match).toEqual({
        start: 4,
        end: 8,
        query: 'Ali'
      });
    });

    it('should find empty mention query', () => {
      const content = 'Hey @';
      const cursorPosition = 5;
      const match = findMentionQuery(content, cursorPosition);
      
      expect(match).toEqual({
        start: 4,
        end: 5,
        query: ''
      });
    });

    it('should return null when no mention query', () => {
      const content = 'Hey there';
      const cursorPosition = 9;
      const match = findMentionQuery(content, cursorPosition);
      
      expect(match).toBeNull();
    });

    it('should handle mention query in middle of text', () => {
      const content = 'Hey @Ali how are you?';
      const cursorPosition = 8;
      const match = findMentionQuery(content, cursorPosition);
      
      expect(match).toEqual({
        start: 4,
        end: 8,
        query: 'Ali'
      });
    });
  });
});

describe('User Filtering', () => {
  describe('filterUsersForMention', () => {
    it('should filter users by name', () => {
      const filtered = filterUsersForMention(mockUsers, 'Alice');
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Alice Johnson');
    });

    it('should filter users by email', () => {
      const filtered = filterUsersForMention(mockUsers, 'bob@');
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Bob Smith');
    });

    it('should filter users by role', () => {
      const filtered = filterUsersForMention(mockUsers, 'Developer');
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Bob Smith');
    });

    it('should return all users for empty query', () => {
      const filtered = filterUsersForMention(mockUsers, '');
      
      expect(filtered).toHaveLength(3);
    });

    it('should limit results to 10 users', () => {
      const manyUsers = Array.from({ length: 15 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        role: 'Developer'
      }));
      
      const filtered = filterUsersForMention(manyUsers, '');
      
      expect(filtered).toHaveLength(10);
    });

    it('should prioritize exact name matches', () => {
      const usersWithSimilarNames = [
        ...mockUsers,
        {
          id: 'user-4',
          name: 'Alice Cooper',
          role: 'Designer'
        }
      ];
      
      const filtered = filterUsersForMention(usersWithSimilarNames, 'Alice');
      
      expect(filtered[0].name).toBe('Alice Cooper'); // Exact match first
      expect(filtered[1].name).toBe('Alice Johnson');
    });
  });
});

describe('Mention Replacement', () => {
  describe('replaceMentionQuery', () => {
    it('should replace mention query with user name', () => {
      const content = 'Hey @Ali';
      const mentionMatch = {
        start: 4,
        end: 8,
        query: 'Ali'
      };
      const selectedUser = mockUsers[0];
      
      const result = replaceMentionQuery(content, mentionMatch, selectedUser);
      
      expect(result.content).toBe('Hey @AliceJohnson ');
      expect(result.cursorPosition).toBe(18);
    });

    it('should handle mention in middle of text', () => {
      const content = 'Hey @Ali how are you?';
      const mentionMatch = {
        start: 4,
        end: 8,
        query: 'Ali'
      };
      const selectedUser = mockUsers[0];
      
      const result = replaceMentionQuery(content, mentionMatch, selectedUser);
      
      expect(result.content).toBe('Hey @AliceJohnson  how are you?');
    });

    it('should handle user names with spaces', () => {
      const content = 'Hey @Carol';
      const mentionMatch = {
        start: 4,
        end: 10,
        query: 'Carol'
      };
      const selectedUser = mockUsers[2];
      
      const result = replaceMentionQuery(content, mentionMatch, selectedUser);
      
      expect(result.content).toBe('Hey @CarolDavis ');
    });
  });
});

describe('Mention Display Formatting', () => {
  describe('formatMentionsForDisplay', () => {
    it('should format mentions as HTML spans', () => {
      const content = 'Hey @AliceJohnson, can you help?';
      const formatted = formatMentionsForDisplay(content, mockUsers);
      
      expect(formatted).toContain('<span class="mention" data-user-id="user-1">@Alice Johnson</span>');
    });

    it('should handle multiple mentions', () => {
      const content = '@AliceJohnson and @BobSmith please review';
      const formatted = formatMentionsForDisplay(content, mockUsers);
      
      expect(formatted).toContain('data-user-id="user-1"');
      expect(formatted).toContain('data-user-id="user-2"');
    });

    it('should return original content when no mentions', () => {
      const content = 'No mentions here';
      const formatted = formatMentionsForDisplay(content, mockUsers);
      
      expect(formatted).toBe(content);
    });
  });
});

describe('Mention Validation', () => {
  describe('validateMentions', () => {
    it('should validate correct mentions', () => {
      const content = 'Hey @AliceJohnson, how are you?';
      const validation = validateMentions(content, mockUsers);
      
      expect(validation.isValid).toBe(true);
      expect(validation.invalidMentions).toHaveLength(0);
    });

    it('should detect invalid mentions', () => {
      const content = 'Hey @NonExistentUser, are you there?';
      const validation = validateMentions(content, mockUsers);
      
      expect(validation.isValid).toBe(false);
      expect(validation.invalidMentions).toContain('@NonExistentUser');
    });

    it('should handle mixed valid and invalid mentions', () => {
      const content = '@AliceJohnson and @InvalidUser please check';
      const validation = validateMentions(content, mockUsers);
      
      expect(validation.isValid).toBe(false);
      expect(validation.invalidMentions).toContain('@InvalidUser');
      expect(validation.invalidMentions).not.toContain('@AliceJohnson');
    });
  });
});

describe('Mention Statistics', () => {
  describe('getMentionStats', () => {
    it('should calculate mention statistics', () => {
      const content = '@AliceJohnson and @BobSmith and @AliceJohnson again';
      const stats = getMentionStats(content, mockUsers);
      
      expect(stats.totalMentions).toBe(3);
      expect(stats.uniqueUsers).toBe(2);
      expect(stats.mentionedUsers).toHaveLength(2);
    });

    it('should handle content with no mentions', () => {
      const content = 'No mentions here';
      const stats = getMentionStats(content, mockUsers);
      
      expect(stats.totalMentions).toBe(0);
      expect(stats.uniqueUsers).toBe(0);
      expect(stats.mentionedUsers).toHaveLength(0);
    });
  });
});

describe('Utility Functions', () => {
  describe('sanitizeMentionContent', () => {
    it('should remove script tags', () => {
      const content = 'Hey @Alice <script>alert("xss")</script>';
      const sanitized = sanitizeMentionContent(content);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toBe('Hey @Alice ');
    });

    it('should remove HTML tags', () => {
      const content = 'Hey @Alice <div>test</div>';
      const sanitized = sanitizeMentionContent(content);
      
      expect(sanitized).toBe('Hey @Alice test');
    });

    it('should trim whitespace', () => {
      const content = '  Hey @Alice  ';
      const sanitized = sanitizeMentionContent(content);
      
      expect(sanitized).toBe('Hey @Alice');
    });
  });

  describe('userToMentionText', () => {
    it('should convert user name to mention format', () => {
      const mentionText = userToMentionText(mockUsers[0]);
      
      expect(mentionText).toBe('AliceJohnson');
    });

    it('should handle names with multiple spaces', () => {
      const user = {
        id: 'user-test',
        name: 'John   Doe   Smith',
        role: 'Developer'
      };
      const mentionText = userToMentionText(user);
      
      expect(mentionText).toBe('JohnDoeSmith');
    });
  });

  describe('isCursorInMention', () => {
    it('should detect cursor within mention', () => {
      const content = 'Hey @AliceJohnson, how are you?';
      const cursorPosition = 10; // Within @AliceJohnson
      const isInMention = isCursorInMention(content, cursorPosition, mockUsers);
      
      expect(isInMention).toBe(true);
    });

    it('should detect cursor outside mention', () => {
      const content = 'Hey @AliceJohnson, how are you?';
      const cursorPosition = 20; // After mention
      const isInMention = isCursorInMention(content, cursorPosition, mockUsers);
      
      expect(isInMention).toBe(false);
    });

    it('should handle content with no mentions', () => {
      const content = 'No mentions here';
      const cursorPosition = 5;
      const isInMention = isCursorInMention(content, cursorPosition, mockUsers);
      
      expect(isInMention).toBe(false);
    });
  });
});

describe('Edge Cases', () => {
  it('should handle empty content', () => {
    const mentions = parseMentions('', mockUsers);
    expect(mentions).toHaveLength(0);
  });

  it('should handle empty user list', () => {
    const mentions = parseMentions('@Alice', []);
    expect(mentions).toHaveLength(0);
  });

  it('should handle special characters in mentions', () => {
    const content = '@Alice-Johnson @Bob_Smith @Carol.Davis';
    const mentions = parseMentions(content, mockUsers);
    // Should not match due to special characters
    expect(mentions).toHaveLength(0);
  });

  it('should handle case sensitivity', () => {
    const content = '@alicejohnson'; // lowercase
    const mentions = parseMentions(content, mockUsers);
    expect(mentions).toHaveLength(1); // Should still match
  });

  it('should handle mentions at start and end of content', () => {
    const content = '@AliceJohnson hello @BobSmith';
    const mentions = parseMentions(content, mockUsers);
    
    expect(mentions).toHaveLength(2);
    expect(mentions[0].start).toBe(0);
    expect(mentions[1].start).toBe(20);
  });
});