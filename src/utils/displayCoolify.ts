import chalk from 'chalk';
import { CoolifyResource } from '../api/coolify';
export function displayCoolifyResults(resources: CoolifyResource[], ipAddress: string): void {
  if (resources.length === 0) {
    console.log(chalk.yellow(`\nNo Coolify resources found for IP address: ${ipAddress}`));
    return;
  }
  console.log(chalk.green(`\nFound ${resources.length} Coolify resource(s) using IP ${ipAddress}:\n`));
  const applications = resources.filter(r => r.type === 'application');
  const services = resources.filter(r => r.type === 'service');
  const databases = resources.filter(r => r.type === 'database');
  if (applications.length > 0) {
    console.log(chalk.cyan('Applications:'));
    applications.forEach(app => {
      const status = app.status ? 
        (app.status === 'running' ? chalk.green(app.status) : chalk.yellow(app.status)) : 
        chalk.gray('unknown');
      console.log(`  → ${chalk.white(app.name)} [${status}]`);
      if (app.fqdn) {
        console.log(`    URL: ${chalk.blue(app.fqdn)}`);
      }
      console.log(`    Server: ${app.server_name} (${app.server_ip})`);
      console.log(`    Environment: ${app.environment}`);
    });
    console.log();
  }
  if (services.length > 0) {
    console.log(chalk.cyan('Services:'));
    services.forEach(service => {
      console.log(`  → ${chalk.white(service.name)}`);
      if (service.fqdn) {
        console.log(`    URL: ${chalk.blue(service.fqdn)}`);
      }
      console.log(`    Server: ${service.server_name} (${service.server_ip})`);
      console.log(`    Environment: ${service.environment}`);
    });
    console.log();
  }
  if (databases.length > 0) {
    console.log(chalk.cyan('Databases:'));
    databases.forEach(db => {
      const status = db.status ? 
        (db.status === 'running' ? chalk.green(db.status) : chalk.yellow(db.status)) : 
        chalk.gray('unknown');
      console.log(`  → ${chalk.white(db.name)} [${status}]`);
      console.log(`    Server: ${db.server_name} (${db.server_ip})`);
      console.log(`    Environment: ${db.environment}`);
    });
    console.log();
  }
}
export function formatCoolifyTextOutput(resources: CoolifyResource[], ip: string): string {
  let output = `Coolify resources using IP ${ip}\n`;
  output += '='.repeat(50) + '\n\n';
  if (resources.length === 0) {
    output += 'No resources found.\n';
    return output;
  }
  const applications = resources.filter(r => r.type === 'application');
  const services = resources.filter(r => r.type === 'service');
  const databases = resources.filter(r => r.type === 'database');
  if (applications.length > 0) {
    output += 'Applications:\n';
    applications.forEach(app => {
      output += `  - ${app.name} [${app.status || 'unknown'}]\n`;
      if (app.fqdn) output += `    URL: ${app.fqdn}\n`;
      output += `    Server: ${app.server_name} (${app.server_ip})\n`;
      output += `    Environment: ${app.environment}\n`;
    });
    output += '\n';
  }
  if (services.length > 0) {
    output += 'Services:\n';
    services.forEach(service => {
      output += `  - ${service.name}\n`;
      if (service.fqdn) output += `    URL: ${service.fqdn}\n`;
      output += `    Server: ${service.server_name} (${service.server_ip})\n`;
      output += `    Environment: ${service.environment}\n`;
    });
    output += '\n';
  }
  if (databases.length > 0) {
    output += 'Databases:\n';
    databases.forEach(db => {
      output += `  - ${db.name} [${db.status || 'unknown'}]\n`;
      output += `    Server: ${db.server_name} (${db.server_ip})\n`;
      output += `    Environment: ${db.environment}\n`;
    });
    output += '\n';
  }
  return output;
}
