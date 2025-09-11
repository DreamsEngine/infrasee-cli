#!/usr/bin/env node

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { loadConfig, validateConfig, validateCoolifyConfig } from './config/config';
import { CloudflareAPI } from './api/cloudflare';
import { CoolifyAPI } from './api/coolify';
import { isValidIP } from './utils/validation';
import { displayResults, displayError, displayInfo } from './utils/display';
import { displayCoolifyResults, formatCoolifyTextOutput } from './utils/displayCoolify';
import { generateCSV, combineDomainData } from './utils/csv';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync } from 'fs';

const program = new Command();

program
  .name('dreamsflare')
  .description('CLI tool to find all domains using a specific IP address via Cloudflare API')
  .version('1.0.0');

program
  .command('ip')
  .description('Find all domains using a specific IP address')
  .argument('<ip>', 'IP address to search for')
  .option('-j, --json', 'Output results as JSON')
  .option('-s, --simple', 'Output simple list of domains only')
  .option('-o, --output <file>', 'Save results to a file')
  .action(async (ip: string, options: { json?: boolean; simple?: boolean; output?: string }) => {
    // Validate IP address
    if (!isValidIP(ip)) {
      displayError(`Invalid IP address: ${ip}`);
      process.exit(1);
    }

    // Load and validate configuration
    const config = loadConfig();
    if (!validateConfig(config)) {
      displayError('No valid Cloudflare credentials found.');
      console.log(chalk.yellow('\nPlease configure your credentials using one of these methods:\n'));
      console.log('1. Set environment variables:');
      console.log('   - CLOUDFLARE_API_TOKEN (recommended)');
      console.log('   - OR CLOUDFLARE_EMAIL and CLOUDFLARE_API_KEY\n');
      console.log('2. Create a .env file in the current directory\n');
      console.log('3. Run: dreamsflare config');
      process.exit(1);
    }

    const spinner = ora('Connecting to Cloudflare API...').start();

    try {
      const api = new CloudflareAPI(config);
      
      // Test connection
      spinner.text = 'Verifying credentials...';
      const isConnected = await api.testConnection();
      if (!isConnected) {
        spinner.fail('Failed to authenticate with Cloudflare API');
        displayError('Please check your credentials');
        process.exit(1);
      }

      spinner.text = `Searching for domains using IP ${ip}...`;
      const records = await api.findDomainsByIP(ip);
      spinner.succeed('Search completed');

      // Handle output
      if (options.simple) {
        // Simple output: IP with domain names
        const domains = [...new Set(records.map(r => r.name))].sort();
        const simpleResult = { [ip]: domains };
        const simpleOutput = JSON.stringify(simpleResult, null, 2);
        if (options.output) {
          writeFileSync(options.output, simpleOutput);
          displayInfo(`Results saved to ${options.output}`);
        } else {
          console.log(simpleOutput);
        }
      } else if (options.json) {
        const jsonOutput = JSON.stringify(records, null, 2);
        if (options.output) {
          writeFileSync(options.output, jsonOutput);
          displayInfo(`Results saved to ${options.output}`);
        } else {
          console.log(jsonOutput);
        }
      } else {
        displayResults(records, ip);
        if (options.output) {
          const textOutput = formatTextOutput(records, ip);
          writeFileSync(options.output, textOutput);
          displayInfo(`Results saved to ${options.output}`);
        }
      }

    } catch (error) {
      spinner.fail('Operation failed');
      displayError((error as Error).message);
      process.exit(1);
    }
  });

// Coolify command group
const coolifyCommand = program
  .command('coolify')
  .description('Coolify-related commands');

coolifyCommand
  .command('ip')
  .description('Find all Coolify resources using a specific IP address')
  .argument('<ip>', 'IP address to search for')
  .option('-j, --json', 'Output results as JSON')
  .option('-s, --simple', 'Output simple list of domains only')
  .option('-o, --output <file>', 'Save results to a file')
  .action(async (ip: string, options: { json?: boolean; simple?: boolean; output?: string }) => {
    // Validate IP address
    if (!isValidIP(ip)) {
      displayError(`Invalid IP address: ${ip}`);
      process.exit(1);
    }

    // Load and validate configuration
    const config = loadConfig();
    if (!validateCoolifyConfig(config)) {
      displayError('No valid Coolify credentials found.');
      console.log(chalk.yellow('\nPlease configure your Coolify credentials:\n'));
      console.log('1. Set environment variables:');
      console.log('   - COOLIFY_API_TOKEN');
      console.log('   - COOLIFY_URL (optional, defaults to https://iggy.dreamsengine.io)\n');
      console.log('2. Add to .env file in the current directory\n');
      console.log('3. Run: dreamsflare coolify config');
      process.exit(1);
    }

    const spinner = ora('Connecting to Coolify API...').start();

    try {
      const api = new CoolifyAPI(config);
      
      // Test connection
      spinner.text = 'Verifying credentials...';
      const isConnected = await api.testConnection();
      if (!isConnected) {
        spinner.fail('Failed to authenticate with Coolify API');
        displayError('Please check your credentials and Coolify URL');
        process.exit(1);
      }

      spinner.text = `Searching for Coolify resources using IP ${ip}...`;
      const resources = await api.findResourcesByIP(ip);
      spinner.succeed('Search completed');

      // Handle output
      if (options.simple) {
        // Simple output: IP with domain names (FQDNs)
        const domains = [...new Set(resources
          .filter(r => r.fqdn)
          .map(r => r.fqdn as string))].sort();
        const simpleResult = { [ip]: domains };
        const simpleOutput = JSON.stringify(simpleResult, null, 2);
        if (options.output) {
          writeFileSync(options.output, simpleOutput);
          displayInfo(`Results saved to ${options.output}`);
        } else {
          console.log(simpleOutput);
        }
      } else if (options.json) {
        const jsonOutput = JSON.stringify(resources, null, 2);
        if (options.output) {
          writeFileSync(options.output, jsonOutput);
          displayInfo(`Results saved to ${options.output}`);
        } else {
          console.log(jsonOutput);
        }
      } else {
        displayCoolifyResults(resources, ip);
        if (options.output) {
          const textOutput = formatCoolifyTextOutput(resources, ip);
          writeFileSync(options.output, textOutput);
          displayInfo(`Results saved to ${options.output}`);
        }
      }

    } catch (error) {
      spinner.fail('Operation failed');
      displayError((error as Error).message);
      process.exit(1);
    }
  });

coolifyCommand
  .command('config')
  .description('Configure Coolify API credentials')
  .option('--token <token>', 'Coolify API Token')
  .option('--url <url>', 'Coolify URL (optional)')
  .action(async (options: { token?: string; url?: string }) => {
    const configDir = join(homedir(), '.dreamsflare');
    const configPath = join(configDir, 'config.json');

    try {
      // Create directory if it doesn't exist
      mkdirSync(configDir, { recursive: true });

      // Load existing config
      let existingConfig: any = {};
      try {
        const fs = await import('fs');
        if (fs.existsSync(configPath)) {
          existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
      } catch {
        // File doesn't exist or is invalid
      }

      if (!options.token) {
        displayError('Please provide --token');
        process.exit(1);
      }

      existingConfig.coolifyApiToken = options.token;
      if (options.url) {
        existingConfig.coolifyUrl = options.url;
      } else if (!existingConfig.coolifyUrl) {
        existingConfig.coolifyUrl = 'https://iggy.dreamsengine.io';
      }

      // Test the credentials
      const spinner = ora('Testing Coolify credentials...').start();
      const api = new CoolifyAPI(existingConfig);
      const isValid = await api.testConnection();

      if (!isValid) {
        spinner.fail('Invalid credentials or URL');
        process.exit(1);
      }

      // Save configuration
      writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));
      spinner.succeed('Coolify configuration saved successfully');
      displayInfo(`Config saved to: ${configPath}`);

    } catch (error) {
      displayError((error as Error).message);
      process.exit(1);
    }
  });

coolifyCommand
  .command('test')
  .description('Test Coolify API connection')
  .action(async () => {
    const config = loadConfig();
    
    if (!validateCoolifyConfig(config)) {
      displayError('No valid Coolify credentials found.');
      console.log(chalk.yellow('\nRun "dreamsflare coolify config" to set up your credentials.'));
      process.exit(1);
    }

    const spinner = ora('Testing connection to Coolify API...').start();

    try {
      const api = new CoolifyAPI(config);
      const isConnected = await api.testConnection();
      
      if (isConnected) {
        spinner.succeed('Successfully connected to Coolify API');
        displayInfo(`Using Coolify instance: ${config.coolifyUrl || 'https://iggy.dreamsengine.io'}`);
      } else {
        spinner.fail('Failed to connect to Coolify API');
        displayError('Please check your credentials and URL');
        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Connection test failed');
      displayError((error as Error).message);
      process.exit(1);
    }
  });

// Combined command for searching both Cloudflare and Coolify
const allCommand = program
  .command('all')
  .description('Search both Cloudflare and Coolify');

allCommand
  .command('ip')
  .description('Find all domains from both Cloudflare and Coolify for an IP')
  .argument('<ip>', 'IP address to search for')
  .option('-j, --json', 'Output results as JSON')
  .option('-s, --simple', 'Output simple list of domains only')
  .option('-c, --csv', 'Output as CSV format')
  .option('-o, --output <file>', 'Save results to a file')
  .action(async (ip: string, options: { json?: boolean; simple?: boolean; csv?: boolean; output?: string }) => {
    // Validate IP address
    if (!isValidIP(ip)) {
      displayError(`Invalid IP address: ${ip}`);
      process.exit(1);
    }

    const config = loadConfig();
    const hasCloudflare = validateConfig(config);
    const hasCoolify = validateCoolifyConfig(config);

    if (!hasCloudflare && !hasCoolify) {
      displayError('No valid credentials found for either Cloudflare or Coolify.');
      console.log(chalk.yellow('\nPlease configure at least one service.'));
      process.exit(1);
    }

    const spinner = ora('Searching for domains...').start();
    
    let cloudflareRecords: any[] = [];
    let coolifyResources: any[] = [];
    let errors: string[] = [];

    // Search Cloudflare
    if (hasCloudflare) {
      try {
        spinner.text = 'Searching Cloudflare...';
        const cfApi = new CloudflareAPI(config);
        const isConnected = await cfApi.testConnection();
        if (isConnected) {
          cloudflareRecords = await cfApi.findDomainsByIP(ip);
        } else {
          errors.push('Failed to connect to Cloudflare API');
        }
      } catch (error) {
        errors.push(`Cloudflare: ${(error as Error).message}`);
      }
    }

    // Search Coolify
    if (hasCoolify) {
      try {
        spinner.text = 'Searching Coolify...';
        const coolApi = new CoolifyAPI(config);
        const isConnected = await coolApi.testConnection();
        if (isConnected) {
          coolifyResources = await coolApi.findResourcesByIP(ip);
        } else {
          errors.push('Failed to connect to Coolify API');
        }
      } catch (error) {
        errors.push(`Coolify: ${(error as Error).message}`);
      }
    }

    spinner.succeed('Search completed');

    // Display any errors
    if (errors.length > 0) {
      console.log(chalk.yellow('\nWarnings:'));
      errors.forEach(err => console.log(chalk.yellow(`  - ${err}`)));
    }

    // Handle output formats
    if (options.csv) {
      const combinedData = combineDomainData(ip, cloudflareRecords, coolifyResources);
      const csvOutput = generateCSV(combinedData);
      
      if (options.output) {
        writeFileSync(options.output, csvOutput);
        displayInfo(`CSV saved to ${options.output}`);
      } else {
        console.log(csvOutput);
      }
    } else if (options.simple) {
      // Combine all unique domains
      const allDomains = new Set<string>();
      
      cloudflareRecords.forEach(r => allDomains.add(r.name));
      coolifyResources.filter(r => r.fqdn).forEach(r => allDomains.add(r.fqdn));
      
      const simpleResult = { [ip]: Array.from(allDomains).sort() };
      const simpleOutput = JSON.stringify(simpleResult, null, 2);
      
      if (options.output) {
        writeFileSync(options.output, simpleOutput);
        displayInfo(`Results saved to ${options.output}`);
      } else {
        console.log(simpleOutput);
      }
    } else if (options.json) {
      const jsonResult = {
        ip,
        cloudflare: cloudflareRecords,
        coolify: coolifyResources,
        summary: {
          cloudflare_domains: [...new Set(cloudflareRecords.map(r => r.name))],
          coolify_domains: [...new Set(coolifyResources.filter(r => r.fqdn).map(r => r.fqdn))],
          total_unique_domains: new Set([
            ...cloudflareRecords.map(r => r.name),
            ...coolifyResources.filter(r => r.fqdn).map(r => r.fqdn)
          ]).size
        }
      };
      
      const jsonOutput = JSON.stringify(jsonResult, null, 2);
      
      if (options.output) {
        writeFileSync(options.output, jsonOutput);
        displayInfo(`Results saved to ${options.output}`);
      } else {
        console.log(jsonOutput);
      }
    } else {
      // Default display format
      console.log(chalk.cyan('\n=== Combined Results ===\n'));
      
      if (cloudflareRecords.length > 0) {
        console.log(chalk.green('Cloudflare Domains:'));
        displayResults(cloudflareRecords, ip);
      } else if (hasCloudflare) {
        console.log(chalk.yellow('No domains found in Cloudflare'));
      }
      
      if (coolifyResources.length > 0) {
        console.log(chalk.green('\nCoolify Resources:'));
        displayCoolifyResults(coolifyResources, ip);
      } else if (hasCoolify) {
        console.log(chalk.yellow('No resources found in Coolify'));
      }
      
      // Summary
      const uniqueDomains = new Set([
        ...cloudflareRecords.map(r => r.name),
        ...coolifyResources.filter(r => r.fqdn).map(r => r.fqdn)
      ]);
      
      console.log(chalk.cyan('\n=== Summary ==='));
      console.log(`Total unique domains: ${uniqueDomains.size}`);
      console.log(`Cloudflare domains: ${new Set(cloudflareRecords.map(r => r.name)).size}`);
      console.log(`Coolify domains: ${new Set(coolifyResources.filter(r => r.fqdn).map(r => r.fqdn)).size}`);
    }
  });

program
  .command('config')
  .description('Configure Cloudflare API credentials')
  .option('--token <token>', 'Cloudflare API Token')
  .option('--email <email>', 'Cloudflare account email')
  .option('--key <key>', 'Cloudflare Global API Key')
  .action(async (options: { token?: string; email?: string; key?: string }) => {
    const configDir = join(homedir(), '.dreamsflare');
    const configPath = join(configDir, 'config.json');

    try {
      // Create directory if it doesn't exist
      mkdirSync(configDir, { recursive: true });

      let config: any = {};

      if (options.token) {
        config.cloudflareApiToken = options.token;
        delete config.cloudflareEmail;
        delete config.cloudflareApiKey;
      } else if (options.email && options.key) {
        config.cloudflareEmail = options.email;
        config.cloudflareApiKey = options.key;
        delete config.cloudflareApiToken;
      } else {
        displayError('Please provide either --token OR both --email and --key');
        process.exit(1);
      }

      // Test the credentials
      const spinner = ora('Testing credentials...').start();
      const api = new CloudflareAPI(config);
      const isValid = await api.testConnection();

      if (!isValid) {
        spinner.fail('Invalid credentials');
        process.exit(1);
      }

      // Save configuration
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      spinner.succeed('Configuration saved successfully');
      displayInfo(`Config saved to: ${configPath}`);

    } catch (error) {
      displayError((error as Error).message);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Test Cloudflare API connection')
  .action(async () => {
    const config = loadConfig();
    
    if (!validateConfig(config)) {
      displayError('No valid Cloudflare credentials found.');
      console.log(chalk.yellow('\nRun "dreamsflare config" to set up your credentials.'));
      process.exit(1);
    }

    const spinner = ora('Testing connection to Cloudflare API...').start();

    try {
      const api = new CloudflareAPI(config);
      const isConnected = await api.testConnection();
      
      if (isConnected) {
        spinner.succeed('Successfully connected to Cloudflare API');
        
        // Show which auth method is being used
        if (config.cloudflareApiToken) {
          displayInfo('Using API Token authentication');
        } else {
          displayInfo('Using Email + API Key authentication');
        }
      } else {
        spinner.fail('Failed to connect to Cloudflare API');
        displayError('Please check your credentials');
        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Connection test failed');
      displayError((error as Error).message);
      process.exit(1);
    }
  });

function formatTextOutput(records: any[], ip: string): string {
  let output = `Domains using IP ${ip}\n`;
  output += '='.repeat(50) + '\n\n';

  if (records.length === 0) {
    output += 'No domains found.\n';
    return output;
  }

  const groupedByZone = records.reduce((acc, record) => {
    if (!acc[record.zone_name]) {
      acc[record.zone_name] = [];
    }
    acc[record.zone_name].push(record);
    return acc;
  }, {} as Record<string, any[]>);

  Object.entries(groupedByZone).forEach(([zone, zoneRecords]) => {
    output += `Zone: ${zone}\n`;
    (zoneRecords as any[]).forEach((record: any) => {
      output += `  - ${record.name} [${record.type}] ${record.proxied ? 'Proxied' : 'Direct'}\n`;
      output += `    TTL: ${record.ttl === 1 ? 'Auto' : `${record.ttl}s`}\n`;
    });
    output += '\n';
  });

  return output;
}

program.parse();