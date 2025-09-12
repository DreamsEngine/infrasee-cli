#!/usr/bin/env node
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { loadConfig, validateConfig, validateCoolifyConfig, validateDigitalOceanConfig, saveSecureConfig } from './config/config';
import { CloudflareAPI } from './api/cloudflare';
import { CoolifyAPI } from './api/coolify';
import { DigitalOceanAPI } from './api/digitalocean';
import { isValidIP } from './utils/validation';
import { displayResults, displayError, displayInfo } from './utils/display';
import { validateFilePath } from './utils/security';
import { displayCoolifyResults, formatCoolifyTextOutput } from './utils/displayCoolify';
import { displayDigitalOceanResults, formatDigitalOceanTextOutput } from './utils/displayDigitalOcean';
import { generateCSV, combineDomainData } from './utils/csv';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync } from 'fs';
const program = new Command();
function secureWriteFile(filePath: string, content: string): void {
  try {
    const validatedPath = validateFilePath(filePath);
    writeFileSync(validatedPath, content, 'utf-8');
  } catch (error) {
    displayError(`Security error: ${(error as Error).message}`);
    process.exit(1);
  }
}
program
  .name('infrasee')
  .description('CLI tool to find all domains and resources using a specific IP address across multiple cloud providers')
  .version('1.3.0');
program
  .command('ip')
  .description('Find all domains using a specific IP address')
  .argument('<ip>', 'IP address to search for')
  .option('-j, --json', 'Output results as JSON')
  .option('-s, --simple', 'Output simple list of domains only')
  .option('-o, --output <file>', 'Save results to a file')
  .action(async (ip: string, options: { json?: boolean; simple?: boolean; output?: string }) => {
    if (!isValidIP(ip)) {
      displayError(`Invalid IP address: ${ip}`);
      process.exit(1);
    }
    const config = loadConfig();
    if (!validateConfig(config)) {
      displayError('No valid Cloudflare credentials found.');
      console.log(chalk.yellow('\nPlease configure your credentials using one of these methods:\n'));
      console.log('1. Set environment variables:');
      console.log('   - CLOUDFLARE_API_TOKEN (recommended)');
      console.log('   - OR CLOUDFLARE_EMAIL and CLOUDFLARE_API_KEY\n');
      console.log('2. Create a .env file in the current directory\n');
      console.log('3. Run: infrasee config');
      process.exit(1);
    }
    const spinner = ora('Connecting to Cloudflare API...').start();
    try {
      const api = new CloudflareAPI(config);
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
      if (options.simple) {
        const domains = [...new Set(records.map(r => r.name))].sort();
        const simpleResult = { [ip]: domains };
        const simpleOutput = JSON.stringify(simpleResult, null, 2);
        if (options.output) {
          secureWriteFile(options.output, simpleOutput);
          displayInfo(`Results saved to ${options.output}`);
        } else {
          console.log(simpleOutput);
        }
      } else if (options.json) {
        const jsonOutput = JSON.stringify(records, null, 2);
        if (options.output) {
          secureWriteFile(options.output, jsonOutput);
          displayInfo(`Results saved to ${options.output}`);
        } else {
          console.log(jsonOutput);
        }
      } else {
        displayResults(records, ip);
        if (options.output) {
          const textOutput = formatTextOutput(records, ip);
          secureWriteFile(options.output, textOutput);
          displayInfo(`Results saved to ${options.output}`);
        }
      }
    } catch (error) {
      spinner.fail('Operation failed');
      displayError((error as Error).message);
      process.exit(1);
    }
  });
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
    if (!isValidIP(ip)) {
      displayError(`Invalid IP address: ${ip}`);
      process.exit(1);
    }
    const config = loadConfig();
    if (!validateCoolifyConfig(config)) {
      displayError('No valid Coolify credentials found.');
      console.log(chalk.yellow('\nPlease configure your Coolify credentials:\n'));
      console.log('1. Set environment variables:');
      console.log('   - COOLIFY_API_TOKEN');
      console.log('   - COOLIFY_URL (optional, defaults to https://coolify.example.com)');
      console.log('2. Add to .env file in the current directory\n');
      console.log('3. Run: infrasee coolify config');
      process.exit(1);
    }
    const spinner = ora('Connecting to Coolify API...').start();
    try {
      const api = new CoolifyAPI(config);
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
      if (options.simple) {
        const domains = [...new Set(resources
          .filter(r => r.fqdn)
          .map(r => r.fqdn as string))].sort();
        const simpleResult = { [ip]: domains };
        const simpleOutput = JSON.stringify(simpleResult, null, 2);
        if (options.output) {
          secureWriteFile(options.output, simpleOutput);
          displayInfo(`Results saved to ${options.output}`);
        } else {
          console.log(simpleOutput);
        }
      } else if (options.json) {
        const jsonOutput = JSON.stringify(resources, null, 2);
        if (options.output) {
          secureWriteFile(options.output, jsonOutput);
          displayInfo(`Results saved to ${options.output}`);
        } else {
          console.log(jsonOutput);
        }
      } else {
        displayCoolifyResults(resources, ip);
        if (options.output) {
          const textOutput = formatCoolifyTextOutput(resources, ip);
          secureWriteFile(options.output, textOutput);
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
    const configDir = join(homedir(), '.infrasee');
    const configPath = join(configDir, 'config.json');
    try {
      mkdirSync(configDir, { recursive: true });
      let existingConfig: any = {};
      try {
        const fs = await import('fs');
        if (fs.existsSync(configPath)) {
          existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
      } catch {
      }
      if (!options.token) {
        displayError('Please provide --token');
        process.exit(1);
      }
      existingConfig.coolifyApiToken = options.token;
      if (options.url) {
        existingConfig.coolifyUrl = options.url;
      } else if (!existingConfig.coolifyUrl) {
        existingConfig.coolifyUrl = 'https://coolify.example.com';
      }
      const spinner = ora('Testing Coolify credentials...').start();
      const api = new CoolifyAPI(existingConfig);
      const isValid = await api.testConnection();
      if (!isValid) {
        spinner.fail('Invalid credentials or URL');
        process.exit(1);
      }
      saveSecureConfig(existingConfig);
      spinner.succeed('Coolify configuration saved successfully with encryption');
      displayInfo(`Encrypted config saved to: ${configPath}`);
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
      console.log(chalk.yellow('\nRun "infrasee coolify config" to set up your credentials.'));
      process.exit(1);
    }
    const spinner = ora('Testing connection to Coolify API...').start();
    try {
      const api = new CoolifyAPI(config);
      const isConnected = await api.testConnection();
      if (isConnected) {
        spinner.succeed('Successfully connected to Coolify API');
        displayInfo(`Using Coolify instance: ${config.coolifyUrl || 'https://coolify.example.com'}`);
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
const digitaloceanCommand = program
  .command('digitalocean')
  .description('DigitalOcean-related commands');
digitaloceanCommand
  .command('ip')
  .description('Find all DigitalOcean resources using a specific IP address')
  .argument('<ip>', 'IP address to search for')
  .option('-j, --json', 'Output results as JSON')
  .option('-s, --simple', 'Output simple list of resources only')
  .option('-o, --output <file>', 'Save results to a file')
  .action(async (ip: string, options: { json?: boolean; simple?: boolean; output?: string }) => {
    if (!isValidIP(ip)) {
      displayError(`Invalid IP address: ${ip}`);
      process.exit(1);
    }
    const config = loadConfig();
    if (!validateDigitalOceanConfig(config)) {
      displayError('No valid DigitalOcean credentials found.');
      console.log(chalk.yellow('\nPlease configure your DigitalOcean credentials:\n'));
      console.log('1. Set environment variables:');
      console.log('   - DIGITALOCEAN_TOKEN\n');
      console.log('2. Add to .env file in the current directory\n');
      console.log('3. Run: infrasee digitalocean config');
      process.exit(1);
    }
    const spinner = ora('Connecting to DigitalOcean API...').start();
    try {
      const api = new DigitalOceanAPI(config);
      spinner.text = 'Verifying credentials...';
      const isConnected = await api.testConnection();
      if (!isConnected) {
        spinner.fail('Failed to authenticate with DigitalOcean API');
        displayError('Please check your credentials');
        process.exit(1);
      }
      spinner.text = `Searching for DigitalOcean resources using IP ${ip}...`;
      const resources = await api.findResourcesByIP(ip);
      spinner.succeed('Search completed');
      if (options.simple) {
        const resourceNames = [...new Set(resources.map(r => r.name))].sort();
        const simpleResult = { [ip]: resourceNames };
        const simpleOutput = JSON.stringify(simpleResult, null, 2);
        if (options.output) {
          secureWriteFile(options.output, simpleOutput);
          displayInfo(`Results saved to ${options.output}`);
        } else {
          console.log(simpleOutput);
        }
      } else if (options.json) {
        const jsonOutput = JSON.stringify(resources, null, 2);
        if (options.output) {
          secureWriteFile(options.output, jsonOutput);
          displayInfo(`Results saved to ${options.output}`);
        } else {
          console.log(jsonOutput);
        }
      } else {
        displayDigitalOceanResults(resources, ip);
        if (options.output) {
          const textOutput = formatDigitalOceanTextOutput(resources, ip);
          secureWriteFile(options.output, textOutput);
          displayInfo(`Results saved to ${options.output}`);
        }
      }
    } catch (error) {
      spinner.fail('Operation failed');
      displayError((error as Error).message);
      process.exit(1);
    }
  });
digitaloceanCommand
  .command('config')
  .description('Configure DigitalOcean API credentials')
  .option('--token <token>', 'DigitalOcean API Token')
  .action(async (options: { token?: string }) => {
    const configDir = join(homedir(), '.infrasee');
    const configPath = join(configDir, 'config.json');
    try {
      mkdirSync(configDir, { recursive: true });
      let existingConfig: any = {};
      try {
        const fs = await import('fs');
        if (fs.existsSync(configPath)) {
          existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
      } catch {
      }
      if (!options.token) {
        displayError('Please provide --token');
        process.exit(1);
      }
      existingConfig.digitalOceanToken = options.token;
      const spinner = ora('Testing DigitalOcean credentials...').start();
      const api = new DigitalOceanAPI(existingConfig);
      const isValid = await api.testConnection();
      if (!isValid) {
        spinner.fail('Invalid credentials');
        process.exit(1);
      }
      saveSecureConfig(existingConfig);
      spinner.succeed('DigitalOcean configuration saved successfully with encryption');
      displayInfo(`Encrypted config saved to: ${configPath}`);
    } catch (error) {
      displayError((error as Error).message);
      process.exit(1);
    }
  });
digitaloceanCommand
  .command('test')
  .description('Test DigitalOcean API connection')
  .action(async () => {
    const config = loadConfig();
    if (!validateDigitalOceanConfig(config)) {
      displayError('No valid DigitalOcean credentials found.');
      console.log(chalk.yellow('\nRun "infrasee digitalocean config" to set up your credentials.'));
      process.exit(1);
    }
    const spinner = ora('Testing connection to DigitalOcean API...').start();
    try {
      const api = new DigitalOceanAPI(config);
      const isConnected = await api.testConnection();
      if (isConnected) {
        spinner.succeed('Successfully connected to DigitalOcean API');
        displayInfo('Using DigitalOcean API v2');
      } else {
        spinner.fail('Failed to connect to DigitalOcean API');
        displayError('Please check your credentials');
        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Connection test failed');
      displayError((error as Error).message);
      process.exit(1);
    }
  });
const allCommand = program
  .command('all')
  .description('Search Cloudflare, Coolify, and DigitalOcean');
allCommand
  .command('ip')
  .description('Find all resources from Cloudflare, Coolify, and DigitalOcean for an IP')
  .argument('<ip>', 'IP address to search for')
  .option('-j, --json', 'Output results as JSON')
  .option('-s, --simple', 'Output simple list of domains only')
  .option('-c, --csv', 'Output as CSV format')
  .option('-o, --output <file>', 'Save results to a file')
  .action(async (ip: string, options: { json?: boolean; simple?: boolean; csv?: boolean; output?: string }) => {
    if (!isValidIP(ip)) {
      displayError(`Invalid IP address: ${ip}`);
      process.exit(1);
    }
    const config = loadConfig();
    const hasCloudflare = validateConfig(config);
    const hasCoolify = validateCoolifyConfig(config);
    const hasDigitalOcean = validateDigitalOceanConfig(config);
    if (!hasCloudflare && !hasCoolify && !hasDigitalOcean) {
      displayError('No valid credentials found for any service.');
      console.log(chalk.yellow('\nPlease configure at least one service:'));
      console.log(chalk.cyan('\nFor Cloudflare:'));
      console.log('  1. Set environment variable: CLOUDFLARE_API_TOKEN=your_token');
      console.log('  2. Or run: infrasee config --token your_cloudflare_token');
      console.log(chalk.cyan('\nFor Coolify:'));
      console.log('  1. Set environment variables:');
      console.log('     COOLIFY_API_TOKEN=your_token');
      console.log('     COOLIFY_URL=https://your-coolify-instance.com');
      console.log('  2. Or run: infrasee coolify config --token your_coolify_token --url https://your-instance.com');
      console.log(chalk.cyan('\nFor DigitalOcean:'));
      console.log('  1. Set environment variable: DIGITALOCEAN_TOKEN=your_token');
      console.log('  2. Or run: infrasee digitalocean config --token your_digitalocean_token');
      process.exit(1);
    }
    if (!hasCloudflare || !hasCoolify || !hasDigitalOcean) {
      console.log(chalk.yellow('\n⚠ Warning: Not all services are configured'));
      if (!hasCloudflare) {
        console.log(chalk.gray('  • Cloudflare: Not configured (skipping)'));
        console.log(chalk.gray('    To configure: infrasee config --token your_token'));
      } else {
        console.log(chalk.green('  • Cloudflare: ✓ Configured'));
      }
      if (!hasCoolify) {
        console.log(chalk.gray('  • Coolify: Not configured (skipping)'));
        console.log(chalk.gray('    To configure: infrasee coolify config --token your_token'));
      } else {
        console.log(chalk.green('  • Coolify: ✓ Configured'));
      }
      if (!hasDigitalOcean) {
        console.log(chalk.gray('  • DigitalOcean: Not configured (skipping)'));
        console.log(chalk.gray('    To configure: infrasee digitalocean config --token your_token'));
      } else {
        console.log(chalk.green('  • DigitalOcean: ✓ Configured'));
      }
      console.log('');
    }
    const spinner = ora('Searching for domains...').start();
    let cloudflareRecords: any[] = [];
    let coolifyResources: any[] = [];
    let digitalOceanResources: any[] = [];
    let errors: string[] = [];
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
    if (hasDigitalOcean) {
      try {
        spinner.text = 'Searching DigitalOcean...';
        const doApi = new DigitalOceanAPI(config);
        const isConnected = await doApi.testConnection();
        if (isConnected) {
          digitalOceanResources = await doApi.findResourcesByIP(ip);
        } else {
          errors.push('Failed to connect to DigitalOcean API');
        }
      } catch (error) {
        errors.push(`DigitalOcean: ${(error as Error).message}`);
      }
    }
    spinner.succeed('Search completed');
    if (errors.length > 0) {
      console.log(chalk.yellow('\nWarnings:'));
      errors.forEach(err => console.log(chalk.yellow(`  - ${err}`)));
    }
    if (options.csv) {
      const combinedData = combineDomainData(ip, cloudflareRecords, coolifyResources, digitalOceanResources);
      const csvOutput = generateCSV(combinedData);
      if (options.output) {
        secureWriteFile(options.output, csvOutput);
        displayInfo(`CSV saved to ${options.output}`);
      } else {
        console.log(csvOutput);
      }
    } else if (options.simple) {
      const allDomains = new Set<string>();
      cloudflareRecords.forEach(r => allDomains.add(r.name));
      coolifyResources.filter(r => r.fqdn).forEach(r => allDomains.add(r.fqdn));
      digitalOceanResources.forEach(r => allDomains.add(r.domain || r.name));
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
        digitalocean: digitalOceanResources,
        summary: {
          cloudflare_domains: [...new Set(cloudflareRecords.map(r => r.name))],
          coolify_domains: [...new Set(coolifyResources.filter(r => r.fqdn).map(r => r.fqdn))],
          digitalocean_resources: [...new Set(digitalOceanResources.map(r => r.name))],
          total_unique_domains: new Set([
            ...cloudflareRecords.map(r => r.name),
            ...coolifyResources.filter(r => r.fqdn).map(r => r.fqdn),
            ...digitalOceanResources.filter(r => r.domain).map(r => r.domain)
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
      if (digitalOceanResources.length > 0) {
        console.log(chalk.green('\nDigitalOcean Resources:'));
        displayDigitalOceanResults(digitalOceanResources, ip);
      } else if (hasDigitalOcean) {
        console.log(chalk.yellow('No resources found in DigitalOcean'));
      }
      const uniqueDomains = new Set([
        ...cloudflareRecords.map(r => r.name),
        ...coolifyResources.filter(r => r.fqdn).map(r => r.fqdn),
        ...digitalOceanResources.filter(r => r.domain).map(r => r.domain)
      ]);
      console.log(chalk.cyan('\n=== Summary ==='));
      console.log(`Total unique domains: ${uniqueDomains.size}`);
      console.log(`Cloudflare domains: ${new Set(cloudflareRecords.map(r => r.name)).size}`);
      console.log(`Coolify domains: ${new Set(coolifyResources.filter(r => r.fqdn).map(r => r.fqdn)).size}`);
      console.log(`DigitalOcean resources: ${new Set(digitalOceanResources.map(r => r.name)).size}`);
    }
  });
program
  .command('config')
  .description('Configure Cloudflare API credentials')
  .option('--token <token>', 'Cloudflare API Token')
  .option('--email <email>', 'Cloudflare account email')
  .option('--key <key>', 'Cloudflare Global API Key')
  .action(async (options: { token?: string; email?: string; key?: string }) => {
    const configDir = join(homedir(), '.infrasee');
    const configPath = join(configDir, 'config.json');
    try {
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
      const spinner = ora('Testing credentials...').start();
      const api = new CloudflareAPI(config);
      const isValid = await api.testConnection();
      if (!isValid) {
        spinner.fail('Invalid credentials');
        process.exit(1);
      }
      saveSecureConfig(config);
      spinner.succeed('Configuration saved successfully with encryption');
      displayInfo(`Encrypted config saved to: ${configPath}`);
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
      console.log(chalk.yellow('\nRun "infrasee config" to set up your credentials.'));
      process.exit(1);
    }
    const spinner = ora('Testing connection to Cloudflare API...').start();
    try {
      const api = new CloudflareAPI(config);
      const isConnected = await api.testConnection();
      if (isConnected) {
        spinner.succeed('Successfully connected to Cloudflare API');
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
