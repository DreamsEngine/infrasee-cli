import chalk from 'chalk';
import { DigitalOceanResource } from '../api/digitalocean';
export function displayDigitalOceanResults(resources: DigitalOceanResource[], ip: string): void {
  console.log('');
  if (resources.length === 0) {
    console.log(chalk.yellow(`No DigitalOcean resources found using IP ${ip}`));
    return;
  }
  console.log(chalk.green(`Found ${resources.length} DigitalOcean resource(s) using IP ${ip}:`));
  console.log('');
  const droplets = resources.filter(r => r.type === 'droplet');
  const loadBalancers = resources.filter(r => r.type === 'load_balancer');
  const floatingIPs = resources.filter(r => r.type === 'floating_ip');
  const domainRecords = resources.filter(r => r.type === 'domain_record');
  if (droplets.length > 0) {
    console.log(chalk.cyan('Droplets:'));
    droplets.forEach(droplet => {
      console.log(`  ${chalk.white('→')} ${chalk.green(droplet.name)}`);
      console.log(`    IP: ${droplet.ip_address}`);
      if (droplet.region) console.log(`    Region: ${droplet.region}`);
      if (droplet.status) console.log(`    Status: ${droplet.status}`);
      if (droplet.tags && droplet.tags.length > 0) {
        console.log(`    Tags: ${droplet.tags.join(', ')}`);
      }
    });
    console.log('');
  }
  if (loadBalancers.length > 0) {
    console.log(chalk.cyan('Load Balancers:'));
    loadBalancers.forEach(lb => {
      console.log(`  ${chalk.white('→')} ${chalk.green(lb.name)}`);
      console.log(`    IP: ${lb.ip_address}`);
      if (lb.region) console.log(`    Region: ${lb.region}`);
      if (lb.status) console.log(`    Status: ${lb.status}`);
      if (lb.tags && lb.tags.length > 0) {
        console.log(`    Tags: ${lb.tags.join(', ')}`);
      }
    });
    console.log('');
  }
  if (floatingIPs.length > 0) {
    console.log(chalk.cyan('Floating IPs:'));
    floatingIPs.forEach(fip => {
      console.log(`  ${chalk.white('→')} ${chalk.green(fip.name)}`);
      console.log(`    IP: ${fip.ip_address}`);
      if (fip.region) console.log(`    Region: ${fip.region}`);
      if (fip.status) console.log(`    Status: ${fip.status}`);
    });
    console.log('');
  }
  if (domainRecords.length > 0) {
    console.log(chalk.cyan('Domain Records:'));
    domainRecords.forEach(record => {
      console.log(`  ${chalk.white('→')} ${chalk.green(record.name)}`);
      console.log(`    IP: ${record.ip_address}`);
      if (record.domain) console.log(`    Domain: ${record.domain}`);
    });
    console.log('');
  }
}
export function formatDigitalOceanTextOutput(resources: DigitalOceanResource[], ip: string): string {
  let output = `DigitalOcean Resources using IP ${ip}\n`;
  output += '='.repeat(50) + '\n\n';
  if (resources.length === 0) {
    output += 'No resources found.\n';
    return output;
  }
  const droplets = resources.filter(r => r.type === 'droplet');
  const loadBalancers = resources.filter(r => r.type === 'load_balancer');
  const floatingIPs = resources.filter(r => r.type === 'floating_ip');
  const domainRecords = resources.filter(r => r.type === 'domain_record');
  if (droplets.length > 0) {
    output += 'Droplets:\n';
    droplets.forEach(droplet => {
      output += `  - ${droplet.name}\n`;
      output += `    IP: ${droplet.ip_address}\n`;
      if (droplet.region) output += `    Region: ${droplet.region}\n`;
      if (droplet.status) output += `    Status: ${droplet.status}\n`;
      if (droplet.tags && droplet.tags.length > 0) {
        output += `    Tags: ${droplet.tags.join(', ')}\n`;
      }
    });
    output += '\n';
  }
  if (loadBalancers.length > 0) {
    output += 'Load Balancers:\n';
    loadBalancers.forEach(lb => {
      output += `  - ${lb.name}\n`;
      output += `    IP: ${lb.ip_address}\n`;
      if (lb.region) output += `    Region: ${lb.region}\n`;
      if (lb.status) output += `    Status: ${lb.status}\n`;
      if (lb.tags && lb.tags.length > 0) {
        output += `    Tags: ${lb.tags.join(', ')}\n`;
      }
    });
    output += '\n';
  }
  if (floatingIPs.length > 0) {
    output += 'Floating IPs:\n';
    floatingIPs.forEach(fip => {
      output += `  - ${fip.name}\n`;
      output += `    IP: ${fip.ip_address}\n`;
      if (fip.region) output += `    Region: ${fip.region}\n`;
      if (fip.status) output += `    Status: ${fip.status}\n`;
    });
    output += '\n';
  }
  if (domainRecords.length > 0) {
    output += 'Domain Records:\n';
    domainRecords.forEach(record => {
      output += `  - ${record.name}\n`;
      output += `    IP: ${record.ip_address}\n`;
      if (record.domain) output += `    Domain: ${record.domain}\n`;
    });
    output += '\n';
  }
  return output;
}
