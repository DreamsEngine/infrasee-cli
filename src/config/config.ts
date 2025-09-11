import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

dotenv.config();

export interface Config {
  cloudflareApiToken?: string;
  cloudflareEmail?: string;
  cloudflareApiKey?: string;
  coolifyApiToken?: string;
  coolifyUrl?: string;
}

export function loadConfig(): Config {
  const config: Config = {};

  // Priority 1: Environment variables
  config.cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
  config.cloudflareEmail = process.env.CLOUDFLARE_EMAIL;
  config.cloudflareApiKey = process.env.CLOUDFLARE_API_KEY;
  config.coolifyApiToken = process.env.COOLIFY_API_TOKEN;
  config.coolifyUrl = process.env.COOLIFY_URL;

  // Priority 2: Check for config file in home directory
  const configPath = join(homedir(), '.dreamsflare', 'config.json');
  if (existsSync(configPath)) {
    try {
      const fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
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

export function validateConfig(config: Config): boolean {
  // Check if we have API Token OR Email + API Key
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