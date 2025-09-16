import { createHttpClient, HttpClient } from '../utils/http';
import { Config } from '../config/config';

export interface GCPComputeInstance {
  id: string;
  name: string;
  machineType: string;
  status: string;
  zone: string;
  projectId?: string;
  networkInterfaces: Array<{
    network: string;
    networkIP: string;
    accessConfigs?: Array<{
      type: string;
      name: string;
      natIP: string;
    }>;
  }>;
  labels?: Record<string, string>;
  tags?: {
    items?: string[];
  };
}

export interface GCPLoadBalancer {
  id: string;
  name: string;
  projectId?: string;
  IPAddress?: string;
  IPProtocol?: string;
  portRange?: string;
  region?: string;
  loadBalancingScheme?: string;
  network?: string;
  backendService?: string;
}

export interface GCPCloudRunService {
  projectId?: string;
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  status?: {
    url?: string;
    address?: {
      url?: string;
    };
    traffic?: Array<{
      revisionName: string;
      percent: number;
      url?: string;
    }>;
  };
  spec?: {
    template?: {
      metadata?: {
        labels?: Record<string, string>;
      };
    };
  };
}

export interface GCPGKECluster {
  name: string;
  projectId?: string;
  endpoint?: string;
  location: string;
  status: string;
  currentMasterVersion?: string;
  currentNodeVersion?: string;
  nodeConfig?: {
    machineType?: string;
  };
  nodePools?: Array<{
    name: string;
    config?: {
      machineType?: string;
    };
    instanceGroupUrls?: string[];
  }>;
}

export interface GCPResource {
  type: 'compute_instance' | 'load_balancer' | 'cloud_run' | 'gke_cluster' | 'gke_service';
  name: string;
  ip_address: string;
  projectId?: string;
  region?: string;
  zone?: string;
  status?: string;
  service?: string;
  url?: string;
}

export class GCPAPI {
  private client: HttpClient;
  private projectIds: string[];
  private accessToken?: string;
  private autoDiscoverProjects: boolean = false;

  constructor(config: Config & { autoDiscoverProjects?: boolean }) {
    if (config.autoDiscoverProjects || config.gcpAutoDiscover) {
      this.autoDiscoverProjects = true;
      this.projectIds = []; // Will be populated by discoverProjects()
    } else if (config.gcpProjectIds && config.gcpProjectIds.length > 0) {
      this.projectIds = config.gcpProjectIds;
    } else if (config.gcpProjectId) {
      this.projectIds = [config.gcpProjectId];
    } else {
      this.projectIds = [];
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.gcpAccessToken) {
      this.accessToken = config.gcpAccessToken;
      headers['Authorization'] = `Bearer ${config.gcpAccessToken}`;
    }

    this.client = createHttpClient({
      baseURL: 'https://compute.googleapis.com/compute/v1',
      headers,
      timeout: 30000,
    });
  }

  private async getWithDifferentBase(baseUrl: string, path: string): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const client = createHttpClient({
      baseURL: baseUrl,
      headers,
      timeout: 30000,
    });

    return client.get(path);
  }

  async discoverProjects(): Promise<string[]> {
    if (!this.autoDiscoverProjects) {
      return this.projectIds;
    }

    console.log('Discovering all accessible GCP projects...');
    const discoveredProjects: string[] = [];

    try {
      // Use Cloud Resource Manager API to list all projects
      const response = await this.getWithDifferentBase(
        'https://cloudresourcemanager.googleapis.com',
        '/v1/projects?filter=lifecycleState:ACTIVE'
      );

      if (response.projects && Array.isArray(response.projects)) {
        for (const project of response.projects) {
          if (project.projectId) {
            discoveredProjects.push(project.projectId);
          }
        }
        console.log(`Found ${discoveredProjects.length} accessible projects`);

        // Handle pagination if there are more projects
        let nextPageToken = response.nextPageToken;
        while (nextPageToken) {
          const nextResponse = await this.getWithDifferentBase(
            'https://cloudresourcemanager.googleapis.com',
            `/v1/projects?filter=lifecycleState:ACTIVE&pageToken=${nextPageToken}`
          );

          if (nextResponse.projects && Array.isArray(nextResponse.projects)) {
            for (const project of nextResponse.projects) {
              if (project.projectId) {
                discoveredProjects.push(project.projectId);
              }
            }
          }
          nextPageToken = nextResponse.nextPageToken;
        }
      }
    } catch (error) {
      if (process.env.DEBUG_GCP) {
        console.error('Failed to auto-discover projects. Make sure the service account has resourcemanager.projects.list permission');
      }
      throw error;
    }

    this.projectIds = discoveredProjects;
    return discoveredProjects;
  }

  async testConnection(): Promise<boolean> {
    // If auto-discover is enabled, discover projects first
    if (this.autoDiscoverProjects) {
      try {
        const projects = await this.discoverProjects();
        if (projects.length === 0) {
          console.log('No accessible projects found');
          return false;
        }
        // Auto-discovery successful means connection is valid
        return true;
      } catch (error) {
        return false;
      }
    }

    if (!this.projectIds || this.projectIds.length === 0) {
      return false;
    }
    try {
      // Test connection with the first project
      await this.client.get(`/projects/${this.projectIds[0]}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getComputeInstances(): Promise<GCPComputeInstance[]> {
    const instances: GCPComputeInstance[] = [];

    for (const projectId of this.projectIds) {
      try {
        const response = await this.client.get<{
          items?: Array<{
            zones?: Array<{
              zone?: string;
              instances?: GCPComputeInstance[];
            }>;
          }>;
        }>(`/projects/${projectId}/aggregated/instances`);

        if (response.items) {
          for (const item of Object.values(response.items)) {
            if (item && typeof item === 'object' && 'instances' in item) {
              const zoneData = item as any;
              if (zoneData.instances) {
                for (const instance of zoneData.instances) {
                  instances.push({ ...instance, projectId });
                }
              }
            }
          }
        }
      } catch (error) {
        // Silently skip projects with API errors (not enabled, no permissions, etc.)
        if (process.env.DEBUG_GCP) {
          console.error(`Error fetching instances for project ${projectId}:`, error);
        }
      }
    }
    return instances;
  }

  async getLoadBalancers(): Promise<GCPLoadBalancer[]> {
    const loadBalancers: GCPLoadBalancer[] = [];

    for (const projectId of this.projectIds) {
      try {
        const response = await this.client.get<{
          items?: GCPLoadBalancer[];
        }>(`/projects/${projectId}/global/forwardingRules`);

        if (response.items) {
          for (const lb of response.items) {
            loadBalancers.push({ ...lb, projectId });
          }
        }

        const regionalResponse = await this.client.get<{
          items?: Array<{
            forwardingRules?: GCPLoadBalancer[];
          }>;
        }>(`/projects/${projectId}/aggregated/forwardingRules`);

        if (regionalResponse.items) {
          for (const item of Object.values(regionalResponse.items)) {
            if (item && typeof item === 'object' && 'forwardingRules' in item) {
              const regionData = item as any;
              if (regionData.forwardingRules) {
                for (const lb of regionData.forwardingRules) {
                  loadBalancers.push({ ...lb, projectId });
                }
              }
            }
          }
        }
      } catch (error) {
        // Silently skip projects with API errors (not enabled, no permissions, etc.)
        if (process.env.DEBUG_GCP) {
          console.error(`Error fetching load balancers for project ${projectId}:`, error);
        }
      }
    }
    return loadBalancers;
  }

  async getCloudRunServices(): Promise<GCPCloudRunService[]> {
    const services: GCPCloudRunService[] = [];
    const regions = ['us-central1', 'us-east1', 'us-west1', 'europe-west1', 'asia-east1'];

    for (const projectId of this.projectIds) {
      for (const region of regions) {
        try {
          const response = await this.getWithDifferentBase(
            'https://run.googleapis.com',
            `/apis/serving.knative.dev/v1/namespaces/${projectId}/services?region=${region}`
          );

          if (response.items) {
            for (const service of response.items) {
              services.push({ ...service, projectId });
            }
          }
        } catch {
          continue;
        }
      }
    }
    return services;
  }

  async getGKEClusters(): Promise<GCPGKECluster[]> {
    const clusters: GCPGKECluster[] = [];

    for (const projectId of this.projectIds) {
      try {
        const response = await this.getWithDifferentBase(
          'https://container.googleapis.com',
          `/v1/projects/${projectId}/locations/-/clusters`
        );

        if (response.clusters) {
          for (const cluster of response.clusters) {
            clusters.push({ ...cluster, projectId });
          }
        }
      } catch (error) {
        // Silently skip projects with API errors (not enabled, no permissions, etc.)
        if (process.env.DEBUG_GCP) {
          console.error(`Error fetching GKE clusters for project ${projectId}:`, error);
        }
      }
    }
    return clusters;
  }

  async findResourcesByIP(ipAddress: string): Promise<GCPResource[]> {
    // If auto-discover is enabled, discover projects first
    if (this.autoDiscoverProjects && this.projectIds.length === 0) {
      await this.discoverProjects();
    }

    const resources: GCPResource[] = [];

    try {
      if (this.projectIds.length > 1) {
        console.log(`Searching across ${this.projectIds.length} projects...`);
      }
      console.log('Searching Compute Engine instances...');
      const instances = await this.getComputeInstances();
      for (const instance of instances) {
        if (instance.networkInterfaces) {
          for (const networkInterface of instance.networkInterfaces) {
            if (networkInterface.networkIP === ipAddress) {
              resources.push({
                type: 'compute_instance',
                name: instance.name,
                ip_address: networkInterface.networkIP,
                projectId: instance.projectId,
                zone: instance.zone?.split('/').pop(),
                status: instance.status,
              });
            }
            if (networkInterface.accessConfigs) {
              for (const accessConfig of networkInterface.accessConfigs) {
                if (accessConfig.natIP === ipAddress) {
                  resources.push({
                    type: 'compute_instance',
                    name: instance.name,
                    ip_address: accessConfig.natIP,
                    projectId: instance.projectId,
                    zone: instance.zone?.split('/').pop(),
                    status: instance.status,
                  });
                }
              }
            }
          }
        }
      }

      console.log('Searching Load Balancers...');
      const loadBalancers = await this.getLoadBalancers();
      for (const lb of loadBalancers) {
        if (lb.IPAddress === ipAddress) {
          resources.push({
            type: 'load_balancer',
            name: lb.name,
            ip_address: lb.IPAddress,
            projectId: lb.projectId,
            region: lb.region?.split('/').pop(),
            service: lb.backendService?.split('/').pop(),
          });
        }
      }

      console.log('Searching Cloud Run services...');
      const cloudRunServices = await this.getCloudRunServices();
      for (const service of cloudRunServices) {
        if (service.status?.url) {
          const url = new URL(service.status.url);
          const dnsModule = await import('dns');
          const { promisify } = await import('util');
          const resolve4 = promisify(dnsModule.resolve4);
          
          try {
            const addresses = await resolve4(url.hostname);
            if (addresses.includes(ipAddress)) {
              resources.push({
                type: 'cloud_run',
                name: service.metadata.name,
                ip_address: ipAddress,
                projectId: service.projectId,
                region: service.metadata.labels?.['cloud.googleapis.com/location'],
                url: service.status.url,
              });
            }
          } catch {
            continue;
          }
        }
      }

      console.log('Searching GKE clusters...');
      const gkeClusters = await this.getGKEClusters();
      for (const cluster of gkeClusters) {
        if (cluster.endpoint === ipAddress) {
          resources.push({
            type: 'gke_cluster',
            name: cluster.name,
            ip_address: cluster.endpoint,
            projectId: cluster.projectId,
            region: cluster.location,
            status: cluster.status,
          });
        }
      }
    } catch (error) {
      if (process.env.DEBUG_GCP) {
        console.error('Error searching GCP resources:', error);
      }
      this.handleError(error);
    }

    return resources;
  }

  private handleError(error: any): void {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while calling GCP API');
  }
}