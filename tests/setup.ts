import { jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Setup test environment
beforeAll(async () => {
  // Create temporary directories for testing
  const tempDir = path.join(os.tmpdir(), 'polish-tests');
  await fs.mkdir(tempDir, { recursive: true });
  
  // Set environment variables for testing
  process.env.TEST_TEMP_DIR = tempDir;
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Clean up temporary directories
  const tempDir = process.env.TEST_TEMP_DIR;
  if (tempDir) {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  }
});

// Mock external dependencies
jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

jest.mock('ora', () => ({
  default: jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    text: '',
  })),
}));

// Helper functions for tests
export const createTestFile = async (filePath: string, content: string = ''): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
};

export const createTestFiles = async (files: Array<{ path: string; content?: string }>): Promise<void> => {
  for (const file of files) {
    await createTestFile(file.path, file.content || '');
  }
};

export const getTempDir = (subDir?: string): string => {
  const baseDir = process.env.TEST_TEMP_DIR || os.tmpdir();
  return subDir ? path.join(baseDir, subDir) : baseDir;
};