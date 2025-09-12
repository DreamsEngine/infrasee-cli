export interface CombinedDomainInfo {
  ip: string;
  domain: string;
  dns: 'cloudflare' | 'coolify' | 'digitalocean' | 'cloudflare+coolify' | 'cloudflare+digitalocean' | 'coolify+digitalocean' | 'all';
  inCoolify: boolean;
  inDigitalOcean: boolean;
}

export function generateCSV(data: CombinedDomainInfo[]): string {
  // CSV header
  let csv = 'IP,Domain,Service Provider,In Coolify,In DigitalOcean\n';
  
  // Add data rows
  for (const row of data) {
    // Escape values that might contain commas
    const domain = row.domain.includes(',') ? `"${row.domain}"` : row.domain;
    const ip = row.ip.includes(',') ? `"${row.ip}"` : row.ip;
    
    csv += `${ip},${domain},${row.dns},${row.inCoolify ? 'Yes' : 'No'},${row.inDigitalOcean ? 'Yes' : 'No'}\n`;
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
  
  const digitalOceanDomains = new Set(
    digitalOceanResources
      .filter(r => r.domain)
      .map(r => r.domain)
  );
  
  // Add Cloudflare domains
  const cloudflareDomains = new Set<string>();
  for (const record of cloudflareRecords) {
    cloudflareDomains.add(record.name);
    const inCoolify = coolifyDomains.has(record.name);
    const inDigitalOcean = digitalOceanDomains.has(record.name);
    
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
      inDigitalOcean
    });
  }
  
  // Add Coolify-only domains
  for (const domain of coolifyDomains) {
    if (!cloudflareDomains.has(domain)) {
      const inDigitalOcean = digitalOceanDomains.has(domain);
      combined.push({
        ip,
        domain,
        dns: inDigitalOcean ? 'coolify+digitalocean' : 'coolify',
        inCoolify: true,
        inDigitalOcean
      });
    }
  }
  
  // Add DigitalOcean-only domains
  for (const domain of digitalOceanDomains) {
    if (!cloudflareDomains.has(domain) && !coolifyDomains.has(domain)) {
      combined.push({
        ip,
        domain,
        dns: 'digitalocean',
        inCoolify: false,
        inDigitalOcean: true
      });
    }
  }
  
  // Sort by domain name
  return combined.sort((a, b) => a.domain.localeCompare(b.domain));
}