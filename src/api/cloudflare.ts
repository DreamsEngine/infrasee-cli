import { createHttpClient, HttpClient } from '../utils/http';
import { Config } from '../config/config';

export interface Zone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  development_mode: number;
}

export interface DNSRecord {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  created_on: string;
  modified_on: string;
}

export class CloudflareAPI {
  private client: HttpClient;

  constructor(config: Config) {
    
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (config.cloudflareApiToken) {
      headers['Authorization'] = `Bearer ${config.cloudflareApiToken}`;
    } else if (config.cloudflareEmail && config.cloudflareApiKey) {
      headers['X-Auth-Email'] = config.cloudflareEmail;
      headers['X-Auth-Key'] = config.cloudflareApiKey;
    }

    this.client = createHttpClient({
      baseURL: 'https://api.cloudflare.com/client/v4',
      headers,
      timeout: 30000,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get<{ success: boolean }>('/user/tokens/verify');
      return response.success === true;
    } catch (error) {
      if (error && (error as any).response?.status === 400) {
        // Try zones endpoint for API key auth
        try {
          const zonesResponse = await this.client.get<{ success: boolean }>('/zones', {
            params: { per_page: 1 }
          });
          return zonesResponse.success === true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  async getZones(page = 1, perPage = 50): Promise<{ zones: Zone[], totalPages: number }> {
    try {
      const response = await this.client.get<{
        success: boolean;
        result: Zone[];
        result_info: { total_pages: number };
      }>('/zones', {
        params: {
          page,
          per_page: perPage,
        },
      });

      if (!response.success) {
        throw new Error('Failed to fetch zones');
      }

      return {
        zones: response.result,
        totalPages: response.result_info.total_pages,
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getDNSRecords(zoneId: string, page = 1, perPage = 100): Promise<{ records: DNSRecord[], totalPages: number }> {
    try {
      const response = await this.client.get<{
        success: boolean;
        result: DNSRecord[];
        result_info: { total_pages: number };
      }>(`/zones/${zoneId}/dns_records`, {
        params: {
          page,
          per_page: perPage,
        },
      });

      if (!response.success) {
        throw new Error('Failed to fetch DNS records');
      }

      return {
        records: response.result,
        totalPages: response.result_info.total_pages,
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async findDomainsByIP(ipAddress: string): Promise<DNSRecord[]> {
    const matchingRecords: DNSRecord[] = [];
    
    try {
      // Get all zones
      let currentPage = 1;
      let totalPages = 1;
      
      do {
        const { zones, totalPages: pages } = await this.getZones(currentPage);
        totalPages = pages;
        
        // For each zone, get DNS records
        for (const zone of zones) {
          let recordPage = 1;
          let recordTotalPages = 1;
          
          do {
            const { records, totalPages: recordPages } = await this.getDNSRecords(zone.id, recordPage);
            recordTotalPages = recordPages;
            
            // Filter records that match the IP
            const matches = records.filter(record => 
              (record.type === 'A' || record.type === 'AAAA') && 
              record.content === ipAddress
            );
            
            // Add zone name to each matching record
            matches.forEach(record => {
              record.zone_name = zone.name;
            });
            
            matchingRecords.push(...matches);
            recordPage++;
          } while (recordPage <= recordTotalPages);
        }
        
        currentPage++;
      } while (currentPage <= totalPages);
      
    } catch (error) {
      this.handleError(error);
      throw error;
    }
    
    return matchingRecords;
  }

  private handleError(error: any): void {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while calling Cloudflare API');
  }
}