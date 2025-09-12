import dotenv from 'dotenv';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import CryptoJS from 'crypto-js';
import { createHash } from 'crypto';
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';
dotenv.config({ silent: true, quiet: true } as any);
function getMachineKey(): string {
  const homeDir = homedir();
  const hostname = process.env.HOSTNAME || process.env.COMPUTERNAME || 'default';
  const machineId = `${homeDir}-${hostname}-infrasee-v1.1`;
  return createHash('sha256').update(machineId).digest('hex').substring(0, 32);
}
function encryptData(text: string): string {
  return CryptoJS.AES.encrypt(text, getMachineKey()).toString();
}
function decryptData(encryptedText: string): string {
  try {
    const key = getMachineKey();
    const bytes = CryptoJS.AES.decrypt(encryptedText, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted || decrypted.length === 0) {
      if (process.env.DEBUG_DECRYPT) {
        console.error('Decryption failed: empty result');
      }
      return encryptedText;
    }
    if (decrypted.startsWith('U2FsdGVkX1')) {
      if (process.env.DEBUG_DECRYPT) {
        console.error('Warning: Decrypted value appears to be encrypted again (double encryption)');
      }
      const bytes2 = CryptoJS.AES.decrypt(decrypted, key);
      const decrypted2 = bytes2.toString(CryptoJS.enc.Utf8);
      if (decrypted2 && decrypted2.length > 0) {
        return decrypted2;
      }
    }
    return decrypted;
  } catch (error) {
    if (process.env.DEBUG_DECRYPT) {
      console.error('Decryption error:', error);
    }
    return encryptedText;
  }
}
export interface Config {
  cloudflareApiToken?: string;
  cloudflareEmail?: string;
  cloudflareApiKey?: string;
  coolifyApiToken?: string;
  coolifyUrl?: string;
  digitalOceanToken?: string;
}
export function loadConfig(): Config {
  const config: Config = {};
  config.cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
  config.cloudflareEmail = process.env.CLOUDFLARE_EMAIL;
  config.cloudflareApiKey = process.env.CLOUDFLARE_API_KEY;
  config.coolifyApiToken = process.env.COOLIFY_API_TOKEN;
  config.coolifyUrl = process.env.COOLIFY_URL;
  config.digitalOceanToken = process.env.DIGITALOCEAN_TOKEN;
  const configPath = join(homedir(), '.infrasee', 'config.json');
  if (existsSync(configPath)) {
    try {
      const fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
      const isEncrypted = fileConfig.encrypted === true;
      if (!config.cloudflareApiToken && fileConfig.cloudflareApiToken) {
        config.cloudflareApiToken = isEncrypted ? decryptData(fileConfig.cloudflareApiToken) : fileConfig.cloudflareApiToken;
      }
      if (!config.cloudflareEmail && fileConfig.cloudflareEmail) {
        config.cloudflareEmail = isEncrypted ? decryptData(fileConfig.cloudflareEmail) : fileConfig.cloudflareEmail;
      }
      if (!config.cloudflareApiKey && fileConfig.cloudflareApiKey) {
        config.cloudflareApiKey = isEncrypted ? decryptData(fileConfig.cloudflareApiKey) : fileConfig.cloudflareApiKey;
      }
      if (!config.coolifyApiToken && fileConfig.coolifyApiToken) {
        config.coolifyApiToken = isEncrypted ? decryptData(fileConfig.coolifyApiToken) : fileConfig.coolifyApiToken;
      }
      if (!config.coolifyUrl && fileConfig.coolifyUrl) {
        config.coolifyUrl = fileConfig.coolifyUrl; 
      }
      if (!config.digitalOceanToken && fileConfig.digitalOceanToken) {
        config.digitalOceanToken = isEncrypted ? decryptData(fileConfig.digitalOceanToken) : fileConfig.digitalOceanToken;
      }
    } catch (error) {
    }
  }
  return config;
}
export function validateConfig(config: Config): boolean {
  if (config.cloudflareApiToken) {
    return true;
  }
  if (config.cloudflareEmail && config.cloudflareApiKey) {
    return true;
  }
  return false;
}
export function validateCoolifyConfig(config: Config): boolean {
  return !!config.coolifyApiToken;
}
export function validateDigitalOceanConfig(config: Config): boolean {
  return !!config.digitalOceanToken;
}
export function saveSecureConfig(config: Config): void {
  const configDir = join(homedir(), '.infrasee');
  const configPath = join(configDir, 'config.json');
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true, mode: 0o700 });
  }
  let existingConfig: any = {};
  if (existsSync(configPath)) {
    try {
      const fileContent = readFileSync(configPath, 'utf-8');
      existingConfig = JSON.parse(fileContent);
    } catch {
    }
  }
  const secureConfig: any = {
    encrypted: true,
    version: '1.2.0',
    timestamp: new Date().toISOString()
  };
  const isEncrypted = (value: string): boolean => {
    return !!(value && value.startsWith('U2FsdGVkX1'));
  };
  if (config.cloudflareApiToken) {
    secureConfig.cloudflareApiToken = isEncrypted(config.cloudflareApiToken) 
      ? config.cloudflareApiToken 
      : encryptData(config.cloudflareApiToken);
  } else if (existingConfig.cloudflareApiToken) {
    secureConfig.cloudflareApiToken = existingConfig.cloudflareApiToken;
  }
  if (config.cloudflareEmail) {
    secureConfig.cloudflareEmail = isEncrypted(config.cloudflareEmail)
      ? config.cloudflareEmail
      : encryptData(config.cloudflareEmail);
  } else if (existingConfig.cloudflareEmail) {
    secureConfig.cloudflareEmail = existingConfig.cloudflareEmail;
  }
  if (config.cloudflareApiKey) {
    secureConfig.cloudflareApiKey = isEncrypted(config.cloudflareApiKey)
      ? config.cloudflareApiKey
      : encryptData(config.cloudflareApiKey);
  } else if (existingConfig.cloudflareApiKey) {
    secureConfig.cloudflareApiKey = existingConfig.cloudflareApiKey;
  }
  if (config.coolifyApiToken) {
    secureConfig.coolifyApiToken = isEncrypted(config.coolifyApiToken)
      ? config.coolifyApiToken
      : encryptData(config.coolifyApiToken);
  } else if (existingConfig.coolifyApiToken) {
    secureConfig.coolifyApiToken = existingConfig.coolifyApiToken;
  }
  if (config.coolifyUrl) {
    secureConfig.coolifyUrl = config.coolifyUrl; 
  } else if (existingConfig.coolifyUrl) {
    secureConfig.coolifyUrl = existingConfig.coolifyUrl;
  }
  if (config.digitalOceanToken) {
    secureConfig.digitalOceanToken = isEncrypted(config.digitalOceanToken)
      ? config.digitalOceanToken
      : encryptData(config.digitalOceanToken);
  } else if (existingConfig.digitalOceanToken) {
    secureConfig.digitalOceanToken = existingConfig.digitalOceanToken;
  }
  writeFileSync(configPath, JSON.stringify(secureConfig, null, 2), { mode: 0o600 });
}
export function maskToken(token: string): string {
  if (!token || token.length < 8) return '***';
  const visibleStart = 3;
  const visibleEnd = 3;
  const start = token.substring(0, visibleStart);
  const end = token.substring(token.length - visibleEnd);
  const masked = '*'.repeat(Math.max(token.length - visibleStart - visibleEnd, 3));
  return `${start}${masked}${end}`;
}
