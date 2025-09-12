export interface CombinedDomainInfo {
  ip: string;
  domain: string;
  dns: 'cloudflare' | 'coolify' | 'digitalocean' | 'cloudflare+coolify' | 'cloudflare+digitalocean' | 'coolify+digitalocean' | 'all';
  inCoolify: boolean;
  inDigitalOcean: boolean;
  resourceType?: 'domain' | 'droplet' | 'load_balancer' | 'floating_ip';
}

export function generateCSV(data: CombinedDomainInfo[]): string {
  // CSV header
  let csv = 'IP,Name/Domain,Type,Service Provider,In Coolify,In DigitalOcean\n';
  
  // Add data rows
  for (const row of data) {
    // Escape values that might contain commas
    const domain = row.domain.includes(',') ? `"${row.domain}"` : row.domain;
    const ip = row.ip.includes(',') ? `"${row.ip}"` : row.ip;
    const type = row.resourceType || 'domain';
    
    csv += `${ip},${domain},${type},${row.dns},${row.inCoolify ? 'Yes' : 'No'},${row.inDigitalOcean ? 'Yes' : 'No'}\n`;
  }
  
  return csv;
}

export function combineDomainData(
  ip: string,
  cloudflareRecords: any[],
  coolifyResources: any[],
  digitalOceanResources: any[] = []
): CombinedDomainInfo[] {
  const combined: CombinedDomainInfo[] = [];
  const coolifyDomains = new Set(
    coolifyResources
      .filter(r => r.fqdn)
      .map(r => r.fqdn)
  );
  
  // Separate DigitalOcean domains from other resources
  const digitalOceanDomains = new Set(
    digitalOceanResources
      .filter(r => r.domain)
      .map(r => r.domain)
  );
  
  // Track all DigitalOcean resource names for matching
  const digitalOceanResourceNames = new Set(
    digitalOceanResources.map(r => r.name)
  );
  
  // Add Cloudflare domains
  const cloudflareDomains = new Set<string>();
  for (const record of cloudflareRecords) {
    cloudflareDomains.add(record.name);
    const inCoolify = coolifyDomains.has(record.name);
    const inDigitalOcean = digitalOceanDomains.has(record.name) || digitalOceanResourceNames.has(record.name);
    
    let dns: CombinedDomainInfo['dns'] = 'cloudflare';
    if (inCoolify && inDigitalOcean) {
      dns = 'all';
    } else if (inCoolify) {
      dns = 'cloudflare+coolify';
    } else if (inDigitalOcean) {
      dns = 'cloudflare+digitalocean';
    }
    
    combined.push({
      ip,
      domain: record.name,
      dns,
      inCoolify,
      inDigitalOcean,
      resourceType: 'domain'
    });
  }
  
  // Add Coolify-only domains
  for (const domain of coolifyDomains) {
    if (!cloudflareDomains.has(domain)) {
      const inDigitalOcean = digitalOceanDomains.has(domain) || digitalOceanResourceNames.has(domain);
      combined.push({
        ip,
        domain,
        dns: inDigitalOcean ? 'coolify+digitalocean' : 'coolify',
        inCoolify: true,
        inDigitalOcean,
        resourceType: 'domain'
      });
    }
  }
  
  // Add DigitalOcean resources (both domains and other resources like droplets)
  for (const resource of digitalOceanResources) {
    const resourceName = resource.name;
    const isDomain = !!resource.domain;
    
    // Skip if this is a domain record that's already been added via Cloudflare or Coolify
    if (isDomain && (cloudflareDomains.has(resource.domain) || coolifyDomains.has(resource.domain))) {
      continue;
    }
    
    // Skip if this resource name has already been added
    if (!isDomain && (cloudflareDomains.has(resourceName) || coolifyDomains.has(resourceName))) {
      continue;
    }
    
    // Determine resource type
    let resourceType: CombinedDomainInfo['resourceType'] = 'domain';
    if (resource.type === 'droplet') resourceType = 'droplet';
    else if (resource.type === 'load_balancer') resourceType = 'load_balancer';
    else if (resource.type === 'floating_ip') resourceType = 'floating_ip';
    else if (resource.type === 'domain_record') resourceType = 'domain';
    
    combined.push({
      ip,
      domain: isDomain ? resource.domain : resourceName,
      dns: 'digitalocean',
      inCoolify: false,
      inDigitalOcean: true,
      resourceType
    });
  }
  
  // Sort by domain name
  return combined.sort((a, b) => a.domain.localeCompare(b.domain));
}