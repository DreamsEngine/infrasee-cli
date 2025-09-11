import { createHttpClient, HttpClient } from '../utils/http';
import { Config } from '../config/config';

export interface CoolifyServer {
  id: number;
  uuid: string;
  name: string;
  ip: string;
  user: string;
  port: number;
  description?: string;
}

export interface CoolifyApplication {
  id: number;
  uuid: string;
  name: string;
  fqdn?: string;
  status: string;
  environment_name: string;
  git_repository?: string;
  git_branch?: string;
  destination?: {
    server: CoolifyServer;
  };
}

export interface CoolifyService {
  id: number;
  uuid: string;
  name: string;
  fqdn?: string;
  server?: CoolifyServer;
  applications?: CoolifyApplication[];
}

export interface CoolifyResource {
  type: 'application' | 'service' | 'database';
  name: string;
  fqdn?: string;
  status?: string;
  server_ip?: string;
  server_name?: string;
  environment?: string;
}

export class CoolifyAPI {
  private client: HttpClient;
  private baseUrl: string;

  constructor(config: Config) {
    this.baseUrl = config.coolifyUrl || 'https://iggy.dreamsengine.io';
    
    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (config.coolifyApiToken) {
      headers['Authorization'] = `Bearer ${config.coolifyApiToken}`;
    }

    this.client = createHttpClient({
      baseURL: `${this.baseUrl}/api/v1`,
      headers,
      timeout: 30000,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/servers');
      return true;
    } catch (error) {
      return false;
    }
  }

  async getServers(): Promise<CoolifyServer[]> {
    try {
      const response = await this.client.get<{ data?: CoolifyServer[] } | CoolifyServer[]>('/servers');
      return Array.isArray(response) ? response : (response as any).data || [];
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getApplications(): Promise<CoolifyApplication[]> {
    try {
      const response = await this.client.get<{ data?: CoolifyApplication[] } | CoolifyApplication[]>('/applications');
      return Array.isArray(response) ? response : (response as any).data || [];
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getServices(): Promise<CoolifyService[]> {
    try {
      const response = await this.client.get<{ data?: CoolifyService[] } | CoolifyService[]>('/services');
      return Array.isArray(response) ? response : (response as any).data || [];
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getProjects(): Promise<any[]> {
    try {
      const response = await this.client.get<{ data?: any[] } | any[]>('/projects');
      return Array.isArray(response) ? response : (response as any).data || [];
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getProjectById(projectId: string): Promise<any> {
    try {
      const response = await this.client.get(`/projects/${projectId}`);
      return response;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getEnvironments(projectId: string): Promise<any[]> {
    try {
      const response = await this.client.get<{ data?: any[] } | any[]>(`/projects/${projectId}/environments`);
      return Array.isArray(response) ? response : (response as any).data || [];
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getResourcesByEnvironment(projectId: string, environmentName: string): Promise<any> {
    try {
      const response = await this.client.get(`/projects/${projectId}/${environmentName}`);
      return response;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async findResourcesByIP(ipAddress: string): Promise<CoolifyResource[]> {
    const resources: CoolifyResource[] = [];
    
    try {
      // Get all servers to find which ones match the IP
      const servers = await this.getServers();
      const matchingServers = servers.filter(server => server.ip === ipAddress);
      
      if (matchingServers.length === 0) {
        return resources;
      }

      // Get all projects and their environments to find resources
      const projects = await this.getProjects();
      
      for (const project of projects) {
        try {
          const environments = await this.getEnvironments(project.uuid);
          
          for (const environment of environments) {
            try {
              const envResources = await this.getResourcesByEnvironment(project.uuid, environment.name);
              
              // Process applications
              if (envResources.applications && Array.isArray(envResources.applications)) {
                for (const app of envResources.applications) {
                  // Check if the application's server matches our IP
                  const serverMatch = matchingServers.find(s => 
                    s.uuid === app.destination?.server?.uuid || 
                    s.id === app.destination?.server?.id
                  );
                  
                  if (serverMatch || (app.destination?.server?.ip === ipAddress)) {
                    resources.push({
                      type: 'application',
                      name: app.name,
                      fqdn: app.fqdn,
                      status: app.status,
                      server_ip: ipAddress,
                      server_name: serverMatch?.name || app.destination?.server?.name,
                      environment: environment.name,
                    });
                  }
                }
              }

              // Process services
              if (envResources.services && Array.isArray(envResources.services)) {
                for (const service of envResources.services) {
                  const serverMatch = matchingServers.find(s => 
                    s.uuid === service.server?.uuid || 
                    s.id === service.server?.id
                  );
                  
                  if (serverMatch || (service.server?.ip === ipAddress)) {
                    resources.push({
                      type: 'service',
                      name: service.name,
                      fqdn: service.fqdn,
                      server_ip: ipAddress,
                      server_name: serverMatch?.name || service.server?.name,
                      environment: environment.name,
                    });
                  }
                }
              }

              // Process databases
              if (envResources.databases && Array.isArray(envResources.databases)) {
                for (const db of envResources.databases) {
                  const serverMatch = matchingServers.find(s => 
                    s.uuid === db.destination?.server?.uuid || 
                    s.id === db.destination?.server?.id
                  );
                  
                  if (serverMatch || (db.destination?.server?.ip === ipAddress)) {
                    resources.push({
                      type: 'database',
                      name: db.name,
                      status: db.status,
                      server_ip: ipAddress,
                      server_name: serverMatch?.name || db.destination?.server?.name,
                      environment: environment.name,
                    });
                  }
                }
              }
            } catch (envError) {
              // Continue if one environment fails
              console.error(`Failed to get resources for environment ${environment.name}:`, envError);
            }
          }
        } catch (projError) {
          // Continue if one project fails
          console.error(`Failed to process project ${project.name}:`, projError);
        }
      }
      
    } catch (error) {
      this.handleError(error);
      throw error;
    }
    
    return resources;
  }

  private handleError(error: any): void {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while calling Coolify API');
  }
}