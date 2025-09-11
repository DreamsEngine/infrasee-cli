import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { SecureStorage, maskToken, validateToken } from '../utils/encryption';
import chalk from 'chalk';

// Load .env file quietly
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';
dotenv.config({ silent: true, quiet: true } as any);

export interface Config {
  cloudflareApiToken?: string;
  cloudflareEmail?: string;
  cloudflareApiKey?: string;
  coolifyApiToken?: string;
  coolifyUrl?: string;
}

export function loadSecureConfig(password?: string): Config {
  const config: Config = {};
  
  // Priority 1: Environment variables (still check these first for CI/CD)
  config.cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
  config.cloudflareEmail = process.env.CLOUDFLARE_EMAIL;
  config.cloudflareApiKey = process.env.CLOUDFLARE_API_KEY;
  config.coolifyApiToken = process.env.COOLIFY_API_TOKEN;
  config.coolifyUrl = process.env.COOLIFY_URL;
  
  // Priority 2: Secure encrypted storage
  const secureStorage = new SecureStorage(password);
  if (secureStorage.exists()) {
    try {
      const secureConfig = secureStorage.load();
      if (secureConfig) {
        // Only use secure config values if env vars are not set
        if (!config.cloudflareApiToken && secureConfig.cloudflareApiToken) {
          config.cloudflareApiToken = secureConfig.cloudflareApiToken;
        }
        if (!config.cloudflareEmail && secureConfig.cloudflareEmail) {
          config.cloudflareEmail = secureConfig.cloudflareEmail;
        }
        if (!config.cloudflareApiKey && secureConfig.cloudflareApiKey) {
          config.cloudflareApiKey = secureConfig.cloudflareApiKey;
        }
        if (!config.coolifyApiToken && secureConfig.coolifyApiToken) {
          config.coolifyApiToken = secureConfig.coolifyApiToken;
        }
        if (!config.coolifyUrl && secureConfig.coolifyUrl) {
          config.coolifyUrl = secureConfig.coolifyUrl;
        }
      }
    } catch (error) {
      console.error(chalk.yellow('⚠ Warning: Could not load secure configuration'));
      if (password) {
        console.error(chalk.red('  Invalid password or corrupted configuration file'));
      }
    }
  }
  
  // Priority 3: Legacy unencrypted config (for backward compatibility)
  const legacyConfigPath = join(homedir(), '.dreamsflare', 'config.json');
  if (existsSync(legacyConfigPath) && !secureStorage.exists()) {
    try {
      const fileConfig = JSON.parse(readFileSync(legacyConfigPath, 'utf-8'));
      
      // Migrate to secure storage if we have data
      if (fileConfig.cloudflareApiToken || fileConfig.coolifyApiToken) {
        console.log(chalk.blue('ℹ Migrating configuration to secure storage...'));
        secureStorage.save(fileConfig);
        console.log(chalk.green('✓ Configuration migrated to encrypted storage'));
        
        // Delete old unencrypted file
        const fs = require('fs');
        fs.unlinkSync(legacyConfigPath);
      }
      
      // Use the config values
      if (!config.cloudflareApiToken && fileConfig.cloudflareApiToken) {
        config.cloudflareApiToken = fileConfig.cloudflareApiToken;
      }
      if (!config.cloudflareEmail && fileConfig.cloudflareEmail) {
        config.cloudflareEmail = fileConfig.cloudflareEmail;
      }
      if (!config.cloudflareApiKey && fileConfig.cloudflareApiKey) {
        config.cloudflareApiKey = fileConfig.cloudflareApiKey;
      }
      if (!config.coolifyApiToken && fileConfig.coolifyApiToken) {
        config.coolifyApiToken = fileConfig.coolifyApiToken;
      }
      if (!config.coolifyUrl && fileConfig.coolifyUrl) {
        config.coolifyUrl = fileConfig.coolifyUrl;
      }
    } catch (error) {
      // Silently fail if config file is invalid
    }
  }
  
  return config;
}

export function saveSecureConfig(config: Config, password?: string): void {
  // Validate tokens before saving
  if (config.cloudflareApiToken && !validateToken(config.cloudflareApiToken, 'cloudflare')) {
    throw new Error('Invalid Cloudflare API token format');
  }
  if (config.coolifyApiToken && !validateToken(config.coolifyApiToken, 'coolify')) {
    throw new Error('Invalid Coolify API token format');
  }
  
  const secureStorage = new SecureStorage(password);
  secureStorage.save(config);
}

export function displayConfigStatus(config: Config): void {
  console.log(chalk.cyan('\n=== Configuration Status ===\n'));
  
  // Cloudflare status
  if (config.cloudflareApiToken) {
    console.log(chalk.green('✓ Cloudflare API Token: ') + maskToken(config.cloudflareApiToken));
  } else if (config.cloudflareEmail && config.cloudflareApiKey) {
    console.log(chalk.green('✓ Cloudflare Email: ') + config.cloudflareEmail);
    console.log(chalk.green('✓ Cloudflare API Key: ') + maskToken(config.cloudflareApiKey));
  } else {
    console.log(chalk.gray('✗ Cloudflare: Not configured'));
  }
  
  // Coolify status
  if (config.coolifyApiToken) {
    console.log(chalk.green('✓ Coolify API Token: ') + maskToken(config.coolifyApiToken));
    console.log(chalk.green('✓ Coolify URL: ') + (config.coolifyUrl || 'https://iggy.dreamsengine.io'));
  } else {
    console.log(chalk.gray('✗ Coolify: Not configured'));
  }
  
  // Security status
  const secureStorage = new SecureStorage();
  if (secureStorage.exists()) {
    console.log(chalk.green('\n✓ Credentials are encrypted and stored securely'));
  } else if (existsSync(join(homedir(), '.dreamsflare', 'config.json'))) {
    console.log(chalk.yellow('\n⚠ Credentials are stored in plain text (legacy mode)'));
    console.log(chalk.yellow('  Run "dreamsflare secure migrate" to encrypt them'));
  }
  
  console.log('');
}

export function validateConfig(config: Config): boolean {
  // Check if we have API Token OR Email + API Key
  if (config.cloudflareApiToken) {
    return validateToken(config.cloudflareApiToken, 'cloudflare');
  }
  
  if (config.cloudflareEmail && config.cloudflareApiKey) {
    return true;
  }
  
  return false;
}

export function validateCoolifyConfig(config: Config): boolean {
  return !!config.coolifyApiToken && validateToken(config.coolifyApiToken, 'coolify');
}