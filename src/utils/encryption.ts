import CryptoJS from 'crypto-js';
import { createHash } from 'crypto';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
function getMachineKey(): string {
  const homeDir = homedir();
  const hostname = process.env.HOSTNAME || process.env.COMPUTERNAME || require('os').hostname() || 'default';
  const username = process.env.USER || process.env.USERNAME || 'user';
  const platform = process.platform;
  const arch = process.arch;
  const machineId = [
    homeDir,
    hostname,
    username,
    platform,
    arch,
    'dreamsflare-v1.2-secure'
  ].join('|');
  const salt = createHash('sha256').update(homeDir + hostname + platform).digest();
  const crypto = require('crypto');
  const key = crypto.pbkdf2Sync(machineId, salt, 100000, 32, 'sha256');
  return key.toString('hex').substring(0, 32);
}
export function encrypt(text: string, password?: string): string {
  const key = password || getMachineKey();
  return CryptoJS.AES.encrypt(text, key).toString();
}
export function decrypt(encryptedText: string, password?: string): string {
  const key = password || getMachineKey();
  const bytes = CryptoJS.AES.decrypt(encryptedText, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}
export interface SecureConfig {
  encrypted: boolean;
  version: string;
  data: string; 
  checksum?: string; 
}
export class SecureStorage {
  private configPath: string;
  private password?: string;
  constructor(password?: string) {
    const configDir = join(homedir(), '.dreamsflare');
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true, mode: 0o700 }); 
    }
    this.configPath = join(configDir, 'secure-config.json');
    this.password = password;
  }
  save(config: any): void {
    const jsonString = JSON.stringify(config);
    const encrypted = encrypt(jsonString, this.password);
    const checksum = createHash('sha256').update(encrypted).digest('hex');
    const secureConfig: SecureConfig = {
      encrypted: true,
      version: '1.1.0',
      data: encrypted,
      checksum
    };
    writeFileSync(this.configPath, JSON.stringify(secureConfig, null, 2), { mode: 0o600 });
  }
  load(): any {
    if (!existsSync(this.configPath)) {
      return null;
    }
    try {
      const fileContent = readFileSync(this.configPath, 'utf-8');
      const secureConfig: SecureConfig = JSON.parse(fileContent);
      if (secureConfig.checksum) {
        const currentChecksum = createHash('sha256').update(secureConfig.data).digest('hex');
        if (currentChecksum !== secureConfig.checksum) {
          throw new Error('Configuration file integrity check failed. File may have been tampered with.');
        }
      }
      const decrypted = decrypt(secureConfig.data, this.password);
      return JSON.parse(decrypted);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Malformed UTF-8')) {
        throw new Error('Failed to decrypt configuration. Invalid password or corrupted file.');
      }
      throw error;
    }
  }
  exists(): boolean {
    return existsSync(this.configPath);
  }
  delete(): void {
    if (existsSync(this.configPath)) {
      const fs = require('fs');
      fs.unlinkSync(this.configPath);
    }
  }
}
export function maskToken(token: string): string {
  if (!token || token.length < 8) return '***';
  const visibleStart = 4;
  const visibleEnd = 4;
  const start = token.substring(0, visibleStart);
  const end = token.substring(token.length - visibleEnd);
  const masked = '*'.repeat(Math.max(token.length - visibleStart - visibleEnd, 3));
  return `${start}${masked}${end}`;
}
export function validateToken(token: string, type: 'cloudflare' | 'coolify'): boolean {
  if (!token || token.trim().length === 0) return false;
  const sanitized = token.trim();
  if (type === 'cloudflare') {
    const cfPattern = /^[A-Za-z0-9_-]{40,50}$/;
    return cfPattern.test(sanitized);
  } else if (type === 'coolify') {
    const coolifyPattern = /^\d+\|[A-Za-z0-9]{40,60}$/;
    return coolifyPattern.test(sanitized);
  }
  return false;
}
export function secureEnvVar(key: string, value: string): void {
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
