import CryptoJS from 'crypto-js';
import { createHash } from 'crypto';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

// Generate a machine-specific key with better entropy
function getMachineKey(): string {
  const homeDir = homedir();
  const hostname = process.env.HOSTNAME || process.env.COMPUTERNAME || require('os').hostname() || 'default';
  const username = process.env.USER || process.env.USERNAME || 'user';
  const platform = process.platform;
  const arch = process.arch;
  
  // Combine multiple stable machine identifiers (must be consistent across runs)
  const machineId = [
    homeDir,
    hostname,
    username,
    platform,
    arch,
    'dreamsflare-v1.2-secure'
  ].join('|');
  
  // Use PBKDF2 for key derivation (more secure than simple hash)
  // Salt is derived from stable machine properties
  const salt = createHash('sha256').update(homeDir + hostname + platform).digest();
  const crypto = require('crypto');
  
  // Generate a deterministic key that's consistent across runs
  const key = crypto.pbkdf2Sync(machineId, salt, 100000, 32, 'sha256');
  return key.toString('hex').substring(0, 32);
}

// Encrypt data with AES
export function encrypt(text: string, password?: string): string {
  const key = password || getMachineKey();
  return CryptoJS.AES.encrypt(text, key).toString();
}

// Decrypt data with AES
export function decrypt(encryptedText: string, password?: string): string {
  const key = password || getMachineKey();
  const bytes = CryptoJS.AES.decrypt(encryptedText, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Secure config storage
export interface SecureConfig {
  encrypted: boolean;
  version: string;
  data: string; // Encrypted JSON string
  checksum?: string; // For integrity verification
}

export class SecureStorage {
  private configPath: string;
  private password?: string;

  constructor(password?: string) {
    const configDir = join(homedir(), '.dreamsflare');
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true, mode: 0o700 }); // Restricted permissions
    }
    this.configPath = join(configDir, 'secure-config.json');
    this.password = password;
  }

  // Save encrypted configuration
  save(config: any): void {
    const jsonString = JSON.stringify(config);
    const encrypted = encrypt(jsonString, this.password);
    
    // Create checksum for integrity
    const checksum = createHash('sha256').update(encrypted).digest('hex');
    
    const secureConfig: SecureConfig = {
      encrypted: true,
      version: '1.1.0',
      data: encrypted,
      checksum
    };
    
    // Write with restricted permissions
    writeFileSync(this.configPath, JSON.stringify(secureConfig, null, 2), { mode: 0o600 });
  }

  // Load and decrypt configuration
  load(): any {
    if (!existsSync(this.configPath)) {
      return null;
    }
    
    try {
      const fileContent = readFileSync(this.configPath, 'utf-8');
      const secureConfig: SecureConfig = JSON.parse(fileContent);
      
      // Verify checksum
      if (secureConfig.checksum) {
        const currentChecksum = createHash('sha256').update(secureConfig.data).digest('hex');
        if (currentChecksum !== secureConfig.checksum) {
          throw new Error('Configuration file integrity check failed. File may have been tampered with.');
        }
      }
      
      // Decrypt data
      const decrypted = decrypt(secureConfig.data, this.password);
      return JSON.parse(decrypted);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Malformed UTF-8')) {
        throw new Error('Failed to decrypt configuration. Invalid password or corrupted file.');
      }
      throw error;
    }
  }

  // Check if secure config exists
  exists(): boolean {
    return existsSync(this.configPath);
  }

  // Delete secure config
  delete(): void {
    if (existsSync(this.configPath)) {
      const fs = require('fs');
      fs.unlinkSync(this.configPath);
    }
  }
}

// Mask sensitive data for display
export function maskToken(token: string): string {
  if (!token || token.length < 8) return '***';
  const visibleStart = 4;
  const visibleEnd = 4;
  const start = token.substring(0, visibleStart);
  const end = token.substring(token.length - visibleEnd);
  const masked = '*'.repeat(Math.max(token.length - visibleStart - visibleEnd, 3));
  return `${start}${masked}${end}`;
}

// Validate token format with proper security checks
export function validateToken(token: string, type: 'cloudflare' | 'coolify'): boolean {
  if (!token || token.trim().length === 0) return false;
  
  // Sanitize token - remove any potential injection attempts
  const sanitized = token.trim();
  
  if (type === 'cloudflare') {
    // Cloudflare tokens should be alphanumeric with possible hyphens/underscores
    // Length should be between 40-50 characters typically
    const cfPattern = /^[A-Za-z0-9_-]{40,50}$/;
    return cfPattern.test(sanitized);
  } else if (type === 'coolify') {
    // Coolify tokens have format like "number|alphanumeric"
    // Example: "1|b92QnFSO6YCrfQX3dV8q8K9pkIXUmhwdNvpmatnc"
    const coolifyPattern = /^\d+\|[A-Za-z0-9]{40,60}$/;
    return coolifyPattern.test(sanitized);
  }
  
  return false;
}

// Secure environment variables
export function secureEnvVar(key: string, value: string): void {
  // Store in process env with prefix to avoid conflicts
  process.env[`SECURE_${key}`] = encrypt(value);
}

export function getSecureEnvVar(key: string): string | undefined {
  const encrypted = process.env[`SECURE_${key}`];
  if (!encrypted) return undefined;
  try {
    return decrypt(encrypted);
  } catch {
    return undefined;
  }
}