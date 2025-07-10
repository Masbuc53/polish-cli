import { describe, it, expect } from '@jest/globals';
import { formatBytes, formatDuration, sanitizeFilename, getDatePath } from '../../src/utils/formatting.js';

describe('Formatting utilities', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(1500)).toBe('1.5s');
      expect(formatDuration(65000)).toBe('1m 5s');
      expect(formatDuration(125000)).toBe('2m 5s');
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize invalid characters', () => {
      expect(sanitizeFilename('file<>name')).toBe('file_name');
      expect(sanitizeFilename('file:name')).toBe('file_name');
      expect(sanitizeFilename('file/name')).toBe('file_name');
      expect(sanitizeFilename('file\\name')).toBe('file_name');
      expect(sanitizeFilename('file|name')).toBe('file_name');
      expect(sanitizeFilename('file?name')).toBe('file_name');
      expect(sanitizeFilename('file*name')).toBe('file_name');
      expect(sanitizeFilename('file"name')).toBe('file_name');
    });

    it('should handle spaces and multiple underscores', () => {
      expect(sanitizeFilename('file   name')).toBe('file_name');
      expect(sanitizeFilename('file___name')).toBe('file_name');
      expect(sanitizeFilename('  file name  ')).toBe('_file_name_');
    });
  });

  describe('getDatePath', () => {
    it('should return current year/month path', () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const expected = `${year}/${month}`;
      
      expect(getDatePath()).toBe(expected);
    });
  });
});