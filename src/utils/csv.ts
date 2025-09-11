export interface CombinedDomainInfo {
  ip: string;
  domain: string;
  dns: 'cloudflare' | 'coolify' | 'both';
  inCoolify: boolean;
}

export function generateCSV(data: CombinedDomainInfo[]): string {
  // CSV header
  let csv = 'IP,Domain,DNS Provider,In Coolify\n';
  
  // Add data rows
  for (const row of data) {
    // Escape values that might contain commas
    const domain = row.domain.includes(',') ? `"${row.domain}"` : row.domain;
    const ip = row.ip.includes(',') ? `"${row.ip}"` : row.ip;
    
    csv += `${ip},${domain},${row.dns},${row.inCoolify ? 'Yes' : 'No'}\n`;
  }
  
  return csv;
}

export function combineDomainData(
  ip: string,
  cloudflareRecords: any[],
  coolifyResources: any[]
): CombinedDomainInfo[] {
  const combined: CombinedDomainInfo[] = [];
  const coolifyDomains = new Set(
    coolifyResources
      .filter(r => r.fqdn)
      .map(r => r.fqdn)
  );
  
  // Add Cloudflare domains
  const cloudflareDomains = new Set<string>();
  for (const record of cloudflareRecords) {
    cloudflareDomains.add(record.name);
    const inCoolify = coolifyDomains.has(record.name);
    combined.push({
      ip,
      domain: record.name,
      dns: inCoolify ? 'both' : 'cloudflare',
      inCoolify
    });
  }
  
  // Add Coolify-only domains
  for (const domain of coolifyDomains) {
    if (!cloudflareDomains.has(domain)) {
      combined.push({
        ip,
        domain,
        dns: 'coolify',
        inCoolify: true
      });
    }
  }
  
  // Sort by domain name
  return combined.sort((a, b) => a.domain.localeCompare(b.domain));
}