export interface CombinedDomainInfo {
  ip: string;
  domain: string;
  dns: 'cloudflare' | 'coolify' | 'digitalocean' | 'gcp' | 'cloudflare+coolify' | 'cloudflare+digitalocean' | 'cloudflare+gcp' | 'coolify+digitalocean' | 'coolify+gcp' | 'digitalocean+gcp' | 'cloudflare+coolify+digitalocean' | 'cloudflare+coolify+gcp' | 'cloudflare+digitalocean+gcp' | 'coolify+digitalocean+gcp' | 'all';
  inCoolify: boolean;
  inDigitalOcean: boolean;
  inGCP: boolean;
  resourceType?: 'domain' | 'droplet' | 'load_balancer' | 'floating_ip' | 'compute_instance' | 'cloud_run' | 'gke_cluster' | 'gke_service';
}
export function generateCSV(data: CombinedDomainInfo[]): string {
  let csv = 'IP,Name/Domain,Type,Service Provider,In Coolify,In DigitalOcean,In GCP\n';
  for (const row of data) {
    const domain = row.domain.includes(',') ? `"${row.domain}"` : row.domain;
    const ip = row.ip.includes(',') ? `"${row.ip}"` : row.ip;
    const type = row.resourceType || 'domain';
    csv += `${ip},${domain},${type},${row.dns},${row.inCoolify ? 'Yes' : 'No'},${row.inDigitalOcean ? 'Yes' : 'No'},${row.inGCP ? 'Yes' : 'No'}\n`;
  }
  return csv;
}
export function combineDomainData(
  ip: string,
  cloudflareRecords: any[],
  coolifyResources: any[],
  digitalOceanResources: any[] = [],
  gcpResources: any[] = []
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
  const digitalOceanResourceNames = new Set(
    digitalOceanResources.map(r => r.name)
  );
  const gcpResourceNames = new Set(
    gcpResources.map(r => r.name)
  );
  const gcpUrls = new Set(
    gcpResources
      .filter(r => r.url)
      .map(r => new URL(r.url).hostname)
  );
  const cloudflareDomains = new Set<string>();
  for (const record of cloudflareRecords) {
    cloudflareDomains.add(record.name);
    const inCoolify = coolifyDomains.has(record.name);
    const inDigitalOcean = digitalOceanDomains.has(record.name) || digitalOceanResourceNames.has(record.name);
    const inGCP = gcpResourceNames.has(record.name) || gcpUrls.has(record.name);
    
    let dns: CombinedDomainInfo['dns'] = 'cloudflare';
    if (inCoolify && inDigitalOcean && inGCP) {
      dns = 'all';
    } else if (inCoolify && inDigitalOcean) {
      dns = 'cloudflare+coolify+digitalocean';
    } else if (inCoolify && inGCP) {
      dns = 'cloudflare+coolify+gcp';
    } else if (inDigitalOcean && inGCP) {
      dns = 'cloudflare+digitalocean+gcp';
    } else if (inCoolify) {
      dns = 'cloudflare+coolify';
    } else if (inDigitalOcean) {
      dns = 'cloudflare+digitalocean';
    } else if (inGCP) {
      dns = 'cloudflare+gcp';
    }
    
    combined.push({
      ip,
      domain: record.name,
      dns,
      inCoolify,
      inDigitalOcean,
      inGCP,
      resourceType: 'domain'
    });
  }
  for (const domain of coolifyDomains) {
    if (!cloudflareDomains.has(domain)) {
      const inDigitalOcean = digitalOceanDomains.has(domain) || digitalOceanResourceNames.has(domain);
      const inGCP = gcpResourceNames.has(domain) || gcpUrls.has(domain);
      
      let dns: CombinedDomainInfo['dns'] = 'coolify';
      if (inDigitalOcean && inGCP) {
        dns = 'coolify+digitalocean+gcp';
      } else if (inDigitalOcean) {
        dns = 'coolify+digitalocean';
      } else if (inGCP) {
        dns = 'coolify+gcp';
      }
      
      combined.push({
        ip,
        domain,
        dns,
        inCoolify: true,
        inDigitalOcean,
        inGCP,
        resourceType: 'domain'
      });
    }
  }
  for (const resource of digitalOceanResources) {
    const resourceName = resource.name;
    const isDomain = !!resource.domain;
    if (isDomain && (cloudflareDomains.has(resource.domain) || coolifyDomains.has(resource.domain))) {
      continue;
    }
    if (!isDomain && (cloudflareDomains.has(resourceName) || coolifyDomains.has(resourceName))) {
      continue;
    }
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
      inGCP: false,
      resourceType
    });
  }
  for (const resource of gcpResources) {
    const resourceName = resource.name;
    const resourceUrl = resource.url ? new URL(resource.url).hostname : null;
    const identifier = resourceUrl || resourceName;
    
    if (cloudflareDomains.has(identifier) || coolifyDomains.has(identifier) || digitalOceanResourceNames.has(identifier)) {
      continue;
    }
    
    let resourceType: CombinedDomainInfo['resourceType'] = 'domain';
    if (resource.type === 'compute_instance') resourceType = 'compute_instance';
    else if (resource.type === 'load_balancer') resourceType = 'load_balancer';
    else if (resource.type === 'cloud_run') resourceType = 'cloud_run';
    else if (resource.type === 'gke_cluster') resourceType = 'gke_cluster';
    else if (resource.type === 'gke_service') resourceType = 'gke_service';
    
    combined.push({
      ip,
      domain: identifier,
      dns: 'gcp',
      inCoolify: false,
      inDigitalOcean: false,
      inGCP: true,
      resourceType
    });
  }
  return combined.sort((a, b) => a.domain.localeCompare(b.domain));
}
