import { resolve, isAbsolute, normalize } from 'path';
export function validateFilePath(filePath: string): string {
  const normalized = normalize(filePath);
  if (normalized.includes('..')) {
    throw new Error('Path traversal detected in file path');
  }
  const absolute = isAbsolute(normalized) ? normalized : resolve(process.cwd(), normalized);
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
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  let sanitized = input.substring(0, maxLength);
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  sanitized = sanitized.replace(/[;&|`$<>]/g, '');
  return sanitized.trim();
}
export function isValidIP(ip: string): boolean {
  const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    let message = error.message;
    message = message.replace(/\/[^:\s]+/g, '[path]');
    message = message.replace(/https?:\/\/[^\s]+/g, '[url]');
    message = message.replace(/[A-Za-z0-9_-]{40,}/g, '[token]');
    return message;
  }
  return 'An error occurred';
}
