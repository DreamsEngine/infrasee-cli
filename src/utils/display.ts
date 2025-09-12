import chalk from 'chalk';
import { DNSRecord } from '../api/cloudflare';
export function displayResults(records: DNSRecord[], ipAddress: string): void {
  if (records.length === 0) {
    console.log(chalk.yellow(`\nNo domains found for IP address: ${ipAddress}`));
    return;
  }
  console.log(chalk.green(`\nFound ${records.length} domain(s) using IP ${ipAddress}:\n`));
  const groupedByZone = records.reduce((acc, record) => {
    if (!acc[record.zone_name]) {
      acc[record.zone_name] = [];
    }
    acc[record.zone_name].push(record);
    return acc;
  }, {} as Record<string, DNSRecord[]>);
  Object.entries(groupedByZone).forEach(([zone, zoneRecords]) => {
    console.log(chalk.cyan(`Zone: ${zone}`));
    zoneRecords.forEach(record => {
      const proxiedStatus = record.proxied ? chalk.green('✓ Proxied') : chalk.gray('Direct');
      const recordType = chalk.yellow(record.type);
      console.log(`  → ${chalk.white(record.name)} [${recordType}] ${proxiedStatus}`);
      console.log(`    TTL: ${record.ttl === 1 ? 'Auto' : `${record.ttl}s`}`);
    });
    console.log();
  });
}
export function displayError(message: string): void {
  console.error(chalk.red(`✖ Error: ${message}`));
}
export function displaySuccess(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}
export function displayInfo(message: string): void {
  console.log(chalk.blue(`ℹ ${message}`));
}
