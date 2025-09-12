import { resolve, isAbsolute, normalize } from 'path';

/**
 * Validate and sanitize file paths to prevent path traversal attacks
 */
export function validateFilePath(filePath: string): string {
  // Normalize the path to remove any ../ or ./ sequences
  const normalized = normalize(filePath);
  
  // Check for path traversal attempts
  if (normalized.includes('..')) {
    throw new Error('Path traversal detected in file path');
  }
  
  // Resolve to absolute path
  const absolute = isAbsolute(normalized) ? normalized : resolve(process.cwd(), normalized);
  
  // Ensure the path doesn't try to write to system directories
  const restrictedPaths = [
    '/etc',
    '/usr',
    '/bin',
    '/sbin',
    '/boot',
    '/dev',
    '/proc',
    '/sys',
    '/root',
    'C:\\Windows',
    'C:\\Program Files',
  ];
  
  const lowerPath = absolute.toLowerCase();
  for (const restricted of restrictedPaths) {
    if (lowerPath.startsWith(restricted.toLowerCase())) {
      throw new Error(`Cannot write to system directory: ${restricted}`);
    }
  }
  
  return absolute;
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  
  // Truncate to max length
  let sanitized = input.substring(0, maxLength);
  
  // Remove control characters and non-printable characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // Remove potential command injection characters
  sanitized = sanitized.replace(/[;&|`$<>]/g, '');
  
  return sanitized.trim();
}

/**
 * Validate IP address format
 */
export function isValidIP(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

/**
 * Sanitize error messages to prevent information disclosure
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Remove sensitive patterns from error messages
    let message = error.message;
    
    // Remove file paths
    message = message.replace(/\/[^:\s]+/g, '[path]');
    
    // Remove URLs
    message = message.replace(/https?:\/\/[^\s]+/g, '[url]');
    
    // Remove potential tokens/keys
    message = message.replace(/[A-Za-z0-9_-]{40,}/g, '[token]');
    
    return message;
  }
  
  return 'An error occurred';
}