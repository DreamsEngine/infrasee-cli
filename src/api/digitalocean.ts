import { createHttpClient, HttpClient } from '../utils/http';
import { Config } from '../config/config';
export interface DigitalOceanDroplet {
  id: number;
  name: string;
  memory: number;
  vcpus: number;
  disk: number;
  locked: boolean;
  status: string;
  kernel?: any;
  created_at: string;
  features: string[];
  backup_ids: number[];
  snapshot_ids: number[];
  image: {
    id: number;
    name: string;
    distribution: string;
    slug: string;
    public: boolean;
    regions: string[];
    created_at: string;
    type: string;
    min_disk_size: number;
    size_gigabytes: number;
  };
  volume_ids: string[];
  size: {
    slug: string;
    memory: number;
    vcpus: number;
    disk: number;
    transfer: number;
    price_monthly: number;
    price_hourly: number;
    regions: string[];
    available: boolean;
  };
  size_slug: string;
  networks: {
    v4: Array<{
      ip_address: string;
      netmask: string;
      gateway: string;
      type: string;
    }>;
    v6: Array<{
      ip_address: string;
      netmask: number;
      gateway: string;
      type: string;
    }>;
  };
  region: {
    name: string;
    slug: string;
    features: string[];
    available: boolean;
    sizes: string[];
  };
  tags: string[];
  vpc_uuid?: string;
}
export interface DigitalOceanLoadBalancer {
  id: string;
  name: string;
  ip: string;
  algorithm: string;
  status: string;
  created_at: string;
  forwarding_rules: Array<{
    entry_protocol: string;
    entry_port: number;
    target_protocol: string;
    target_port: number;
    certificate_id?: string;
    tls_passthrough?: boolean;
  }>;
  health_check: {
    protocol: string;
    port: number;
    path?: string;
    check_interval_seconds: number;
    response_timeout_seconds: number;
    healthy_threshold: number;
    unhealthy_threshold: number;
  };
  sticky_sessions?: {
    type: string;
    cookie_name?: string;
    cookie_ttl_seconds?: number;
  };
  region: {
    name: string;
    slug: string;
    available: boolean;
    features: string[];
    sizes: string[];
  };
  tag?: string;
  droplet_ids: number[];
  redirect_http_to_https: boolean;
  enable_proxy_protocol: boolean;
  enable_backend_keepalive: boolean;
  disable_lets_encrypt_dns_records: boolean;
  vpc_uuid?: string;
}
export interface DigitalOceanFloatingIP {
  ip: string;
  region: {
    name: string;
    slug: string;
    available: boolean;
    features: string[];
    sizes: string[];
  };
  droplet?: DigitalOceanDroplet;
  locked: boolean;
}
export interface DigitalOceanDomain {
  name: string;
  ttl: number;
  zone_file?: string;
}
export interface DigitalOceanDomainRecord {
  id: number;
  type: string;
  name: string;
  data: string;
  priority?: number;
  port?: number;
  ttl: number;
  weight?: number;
  flags?: number;
  tag?: string;
}
export interface DigitalOceanResource {
  type: 'droplet' | 'load_balancer' | 'floating_ip' | 'domain_record';
  name: string;
  ip_address: string;
  region?: string;
  status?: string;
  tags?: string[];
  domain?: string;
}
export class DigitalOceanAPI {
  private client: HttpClient;
  constructor(config: Config) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.digitalOceanToken) {
      headers['Authorization'] = `Bearer ${config.digitalOceanToken}`;
    }
    this.client = createHttpClient({
      baseURL: 'https://api.digitalocean.com/v2',
      headers,
      timeout: 30000,
    });
  }
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get<{ account: any }>('/account');
      return !!response.account;
    } catch (error) {
      return false;
    }
  }
  async getDroplets(page = 1, perPage = 100): Promise<{ droplets: DigitalOceanDroplet[], totalPages: number }> {
    try {
      const response = await this.client.get<{
        droplets: DigitalOceanDroplet[];
        links?: {
          pages?: {
            last?: string;
          };
        };
        meta?: {
          total: number;
        };
      }>('/droplets', {
        params: {
          page,
          per_page: perPage,
        },
      });
      let totalPages = 1;
      if (response.meta?.total) {
        totalPages = Math.ceil(response.meta.total / perPage);
      } else if (response.links?.pages?.last) {
        const lastPageMatch = response.links.pages.last.match(/page=(\d+)/);
        if (lastPageMatch) {
          totalPages = parseInt(lastPageMatch[1], 10);
        }
      }
      return {
        droplets: response.droplets || [],
        totalPages,
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  async getLoadBalancers(page = 1, perPage = 100): Promise<{ load_balancers: DigitalOceanLoadBalancer[], totalPages: number }> {
    try {
      const response = await this.client.get<{
        load_balancers: DigitalOceanLoadBalancer[];
        links?: {
          pages?: {
            last?: string;
          };
        };
        meta?: {
          total: number;
        };
      }>('/load_balancers', {
        params: {
          page,
          per_page: perPage,
        },
      });
      let totalPages = 1;
      if (response.meta?.total) {
        totalPages = Math.ceil(response.meta.total / perPage);
      } else if (response.links?.pages?.last) {
        const lastPageMatch = response.links.pages.last.match(/page=(\d+)/);
        if (lastPageMatch) {
          totalPages = parseInt(lastPageMatch[1], 10);
        }
      }
      return {
        load_balancers: response.load_balancers || [],
        totalPages,
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  async getFloatingIPs(): Promise<DigitalOceanFloatingIP[]> {
    try {
      const response = await this.client.get<{
        floating_ips: DigitalOceanFloatingIP[];
      }>('/floating_ips');
      return response.floating_ips || [];
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  async getDomains(): Promise<DigitalOceanDomain[]> {
    try {
      const response = await this.client.get<{
        domains: DigitalOceanDomain[];
      }>('/domains');
      return response.domains || [];
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  async getDomainRecords(domainName: string): Promise<DigitalOceanDomainRecord[]> {
    try {
      const response = await this.client.get<{
        domain_records: DigitalOceanDomainRecord[];
      }>(`/domains/${domainName}/records`);
      return response.domain_records || [];
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return [];
      }
      this.handleError(error);
      throw error;
    }
  }
  async findResourcesByIP(ipAddress: string): Promise<DigitalOceanResource[]> {
    const resources: DigitalOceanResource[] = [];
    try {
      console.log('Searching droplets...');
      let currentPage = 1;
      let hasMorePages = true;
      while (hasMorePages) {
        const { droplets, totalPages } = await this.getDroplets(currentPage);
        for (const droplet of droplets) {
          if (droplet.networks.v4) {
            for (const network of droplet.networks.v4) {
              if (network.ip_address === ipAddress) {
                resources.push({
                  type: 'droplet',
                  name: droplet.name,
                  ip_address: network.ip_address,
                  region: droplet.region.name,
                  status: droplet.status,
                  tags: droplet.tags,
                });
              }
            }
          }
          if (droplet.networks.v6) {
            for (const network of droplet.networks.v6) {
              if (network.ip_address === ipAddress) {
                resources.push({
                  type: 'droplet',
                  name: droplet.name,
                  ip_address: network.ip_address,
                  region: droplet.region.name,
                  status: droplet.status,
                  tags: droplet.tags,
                });
              }
            }
          }
        }
        hasMorePages = currentPage < totalPages;
        currentPage++;
      }
      console.log('Searching load balancers...');
      currentPage = 1;
      hasMorePages = true;
      while (hasMorePages) {
        const { load_balancers, totalPages } = await this.getLoadBalancers(currentPage);
        for (const lb of load_balancers) {
          if (lb.ip === ipAddress) {
            resources.push({
              type: 'load_balancer',
              name: lb.name,
              ip_address: lb.ip,
              region: lb.region.name,
              status: lb.status,
              tags: lb.tag ? [lb.tag] : [],
            });
          }
        }
        hasMorePages = currentPage < totalPages;
        currentPage++;
      }
      console.log('Searching floating IPs...');
      const floatingIPs = await this.getFloatingIPs();
      for (const fip of floatingIPs) {
        if (fip.ip === ipAddress) {
          resources.push({
            type: 'floating_ip',
            name: fip.droplet ? fip.droplet.name : 'Unassigned',
            ip_address: fip.ip,
            region: fip.region.name,
            status: fip.locked ? 'locked' : 'active',
          });
        }
      }
      console.log('Searching domain records...');
      const domains = await this.getDomains();
      for (const domain of domains) {
        const records = await this.getDomainRecords(domain.name);
        for (const record of records) {
          if (record.type === 'A' || record.type === 'AAAA') {
            if (record.data === ipAddress) {
              const recordName = record.name === '@' ? domain.name : `${record.name}.${domain.name}`;
              resources.push({
                type: 'domain_record',
                name: recordName,
                ip_address: record.data,
                domain: domain.name,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error searching DigitalOcean resources:', error);
      this.handleError(error);
    }
    return resources;
  }
  private handleError(error: any): void {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while calling DigitalOcean API');
  }
}
