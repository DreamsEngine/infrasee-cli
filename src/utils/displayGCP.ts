import chalk from 'chalk';
import { GCPResource } from '../api/gcp';

export function displayGCPResults(resources: GCPResource[], ip: string): void {
  console.log('');
  
  if (resources.length === 0) {
    console.log(chalk.yellow(`No GCP resources found using IP ${ip}`));
    return;
  }

  console.log(chalk.green(`Found ${resources.length} GCP resource(s) using IP ${ip}:`));
  console.log('');

  const computeInstances = resources.filter(r => r.type === 'compute_instance');
  const loadBalancers = resources.filter(r => r.type === 'load_balancer');
  const cloudRunServices = resources.filter(r => r.type === 'cloud_run');
  const gkeClusters = resources.filter(r => r.type === 'gke_cluster');

  if (computeInstances.length > 0) {
    console.log(chalk.cyan('Compute Engine Instances:'));
    computeInstances.forEach(instance => {
      console.log(`  ${chalk.white('→')} ${chalk.green(instance.name)}`);
      if (instance.projectId) console.log(`    Project: ${chalk.blue(instance.projectId)}`);
      console.log(`    IP: ${instance.ip_address}`);
      if (instance.zone) console.log(`    Zone: ${instance.zone}`);
      if (instance.status) console.log(`    Status: ${instance.status}`);
    });
    console.log('');
  }

  if (loadBalancers.length > 0) {
    console.log(chalk.cyan('Load Balancers:'));
    loadBalancers.forEach(lb => {
      console.log(`  ${chalk.white('→')} ${chalk.green(lb.name)}`);
      if (lb.projectId) console.log(`    Project: ${chalk.blue(lb.projectId)}`);
      console.log(`    IP: ${lb.ip_address}`);
      if (lb.region) console.log(`    Region: ${lb.region}`);
      if (lb.service) console.log(`    Backend Service: ${lb.service}`);
    });
    console.log('');
  }

  if (cloudRunServices.length > 0) {
    console.log(chalk.cyan('Cloud Run Services:'));
    cloudRunServices.forEach(service => {
      console.log(`  ${chalk.white('→')} ${chalk.green(service.name)}`);
      if (service.projectId) console.log(`    Project: ${chalk.blue(service.projectId)}`);
      console.log(`    IP: ${service.ip_address}`);
      if (service.region) console.log(`    Region: ${service.region}`);
      if (service.url) console.log(`    URL: ${service.url}`);
    });
    console.log('');
  }

  if (gkeClusters.length > 0) {
    console.log(chalk.cyan('GKE Clusters:'));
    gkeClusters.forEach(cluster => {
      console.log(`  ${chalk.white('→')} ${chalk.green(cluster.name)}`);
      if (cluster.projectId) console.log(`    Project: ${chalk.blue(cluster.projectId)}`);
      console.log(`    Endpoint IP: ${cluster.ip_address}`);
      if (cluster.region) console.log(`    Location: ${cluster.region}`);
      if (cluster.status) console.log(`    Status: ${cluster.status}`);
    });
    console.log('');
  }
}

export function formatGCPTextOutput(resources: GCPResource[], ip: string): string {
  let output = `GCP Resources using IP ${ip}\n`;
  output += '='.repeat(50) + '\n\n';

  if (resources.length === 0) {
    output += 'No resources found.\n';
    return output;
  }

  const computeInstances = resources.filter(r => r.type === 'compute_instance');
  const loadBalancers = resources.filter(r => r.type === 'load_balancer');
  const cloudRunServices = resources.filter(r => r.type === 'cloud_run');
  const gkeClusters = resources.filter(r => r.type === 'gke_cluster');

  if (computeInstances.length > 0) {
    output += 'Compute Engine Instances:\n';
    computeInstances.forEach(instance => {
      output += `  - ${instance.name}\n`;
      if (instance.projectId) output += `    Project: ${instance.projectId}\n`;
      output += `    IP: ${instance.ip_address}\n`;
      if (instance.zone) output += `    Zone: ${instance.zone}\n`;
      if (instance.status) output += `    Status: ${instance.status}\n`;
    });
    output += '\n';
  }

  if (loadBalancers.length > 0) {
    output += 'Load Balancers:\n';
    loadBalancers.forEach(lb => {
      output += `  - ${lb.name}\n`;
      if (lb.projectId) output += `    Project: ${lb.projectId}\n`;
      output += `    IP: ${lb.ip_address}\n`;
      if (lb.region) output += `    Region: ${lb.region}\n`;
      if (lb.service) output += `    Backend Service: ${lb.service}\n`;
    });
    output += '\n';
  }

  if (cloudRunServices.length > 0) {
    output += 'Cloud Run Services:\n';
    cloudRunServices.forEach(service => {
      output += `  - ${service.name}\n`;
      if (service.projectId) output += `    Project: ${service.projectId}\n`;
      output += `    IP: ${service.ip_address}\n`;
      if (service.region) output += `    Region: ${service.region}\n`;
      if (service.url) output += `    URL: ${service.url}\n`;
    });
    output += '\n';
  }

  if (gkeClusters.length > 0) {
    output += 'GKE Clusters:\n';
    gkeClusters.forEach(cluster => {
      output += `  - ${cluster.name}\n`;
      if (cluster.projectId) output += `    Project: ${cluster.projectId}\n`;
      output += `    Endpoint IP: ${cluster.ip_address}\n`;
      if (cluster.region) output += `    Location: ${cluster.region}\n`;
      if (cluster.status) output += `    Status: ${cluster.status}\n`;
    });
    output += '\n';
  }

  return output;
}