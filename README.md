# InfraSee CLI v1.5.4

CLI tool to find domains and cloud resources using a specific IP address across multiple providers: Cloudflare, Coolify, DigitalOcean, and Google Cloud Platform.

## What's New

### v1.5.4
- **All Command GCP Auto-Discovery**: The `all` command now supports GCP auto-discovery
- Added `--all-projects` flag to `infrasee all ip` command
- Search across all providers AND all GCP projects simultaneously

### v1.5.3
- **Auto-Discovery for GCP**: Automatically search across ALL accessible GCP projects
- Added `--all-projects` flag to discover and search all GCP projects
- No need to manually list project IDs anymore
- Requires `resourcemanager.projects.list` permission

### v1.5.2
- Improved `--simple` output format with structured JSON by provider
- Each provider's resources are now organized in separate objects
- Added summary information for each provider
- GCP now supports `--simple` output

### v1.5.1
- Organized command structure: All Cloudflare commands now under `infrasee cloudflare`
- Consistent CLI interface across all providers
- Backward compatibility with deprecation warnings for old commands

### v1.5.0
- Added multi-project support for Google Cloud Platform
- Resources now show project ID for better organization

### v1.4.0
- Added Google Cloud Platform support (Compute Engine, Cloud Run, GKE, Load Balancers)

### v1.3.0  
- Added DigitalOcean integration

### v1.2.0
- Replaced Axios with native fetch API (Node.js 18+ required)
- Reduced dependencies for smaller package size

### v1.1.0
- Added encrypted credential storage with AES-256
- Automatic migration from plain text configs

## Features

- Search multiple cloud providers simultaneously
- Export results as JSON, CSV, or simple text
- Encrypted credential storage
- Support for environment variables and .env files
- Colored terminal output with progress indicators

## Quick Start

```bash
# Clone the repository
git clone https://github.com/DreamsEngine/infrasee-cli.git
cd infrasee-cli

# Install and build
npm install && npm run build && npm link

# Configure your API tokens (choose one method)
# Method 1: Using .env file
echo "CLOUDFLARE_API_TOKEN=your_token" >> .env
echo "COOLIFY_API_TOKEN=your_token" >> .env
echo "DIGITALOCEAN_TOKEN=your_token" >> .env
echo "GCP_AUTO_DISCOVER=true" >> .env
echo "GCP_ACCESS_TOKEN=$(gcloud auth print-access-token)" >> .env

# Method 2: Using interactive config
infrasee cloudflare config --token "your_cloudflare_token"
infrasee coolify config --token "your_coolify_token" --url "https://your-coolify.com"
infrasee digitalocean config --token "your_do_token"
infrasee gcp config --auto-discover --token "$(gcloud auth print-access-token)"

# Search for domains across all providers
infrasee all ip 192.168.1.100

# Export results to CSV
infrasee all ip 192.168.1.100 --csv --output report.csv

# Search with GCP auto-discovery
infrasee all ip 192.168.1.100 --all-projects
```

### Quick Test
```bash
# Test if installation worked
infrasee --version
# Should output: 1.5.4

# Test connections to each service
infrasee cloudflare test
infrasee coolify test
infrasee digitalocean test
infrasee gcp test
```

## Prerequisites

- **Node.js 18.0.0 or higher** (Required for native fetch API)
- npm or yarn
- Git

## Installation

### Option 1: Global Installation via npm link (Recommended)

```bash
# Clone the repository
git clone https://github.com/DreamsEngine/infrasee-cli.git
cd infrasee-cli

# Install dependencies
npm install

# Build the TypeScript project
npm run build

# Create global symlink (makes 'infrasee' command available globally)
npm link
```

### Option 2: Install to /usr/local/bin (macOS/Linux)

```bash
# Clone and build
git clone https://github.com/DreamsEngine/infrasee-cli.git
cd infrasee-cli
npm install && npm run build

# Create executable script
echo '#!/usr/bin/env node' > infrasee-cli
echo "require('$(pwd)/dist/cli.js')" >> infrasee-cli
chmod +x infrasee-cli

# Move to global bin (may require sudo)
sudo mv infrasee-cli /usr/local/bin/infrasee
```

### Option 3: Add to PATH

```bash
# Clone and build
git clone https://github.com/DreamsEngine/infrasee-cli.git
cd infrasee-cli
npm install && npm run build

# Add to your shell config (~/.zshrc, ~/.bashrc, or ~/.config/fish/config.fish)
echo "export PATH=\"\$PATH:$(pwd)/dist\"" >> ~/.zshrc
source ~/.zshrc

# Create alias
echo "alias infrasee='node $(pwd)/dist/cli.js'" >> ~/.zshrc
source ~/.zshrc
```

### Homebrew Installation (Coming Soon)

> 🚧 **Note**: We're working on a Homebrew formula for easy installation:
> ```bash
> # Future installation method
> brew tap dreamsengine/infrasee
> brew install infrasee-cli
> ```

### NPM Package (Planned)

> 📦 **Note**: NPM package publishing is planned for a future release:
> ```bash
> # Future installation method
> npm install -g infrasee-cli
> ```

## Configuration

### Cloudflare Configuration

#### Method 1: Environment Variables

```bash
export CLOUDFLARE_API_TOKEN=your_api_token_here
# OR
export CLOUDFLARE_EMAIL=your_email@example.com
export CLOUDFLARE_API_KEY=your_global_api_key_here
```

#### Method 2: .env File

Create a `.env` file in your project directory:

```env
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here

# Coolify Configuration
COOLIFY_API_TOKEN=your_coolify_api_token_here
COOLIFY_URL=https://your-coolify-instance.com

# DigitalOcean Configuration
DIGITALOCEAN_TOKEN=your_digitalocean_api_token_here

# GCP Configuration
# Option 1: Auto-discover all projects (recommended)
GCP_AUTO_DISCOVER=true
GCP_ACCESS_TOKEN=your_access_token
# OR use Service Account key
GCP_SERVICE_ACCOUNT_KEY=/path/to/service-account-key.json

# Option 2: Manually specify projects
# Single project
GCP_PROJECT_ID=your_project_id
# OR multiple projects (comma-separated)
GCP_PROJECT_IDS=project-1,project-2,project-3
GCP_ACCESS_TOKEN=your_access_token
# OR use Service Account key
GCP_SERVICE_ACCOUNT_KEY=/path/to/service-account-key.json
```

#### Method 3: Interactive Configuration

```bash
# Configure Cloudflare
infrasee cloudflare config --token "your_api_token_here"

# Configure Coolify (note: always quote tokens with special characters like |)
infrasee coolify config --token "your_coolify_token" --url https://your-coolify.com

# Configure DigitalOcean
infrasee digitalocean config --token "your_digitalocean_token"

# Configure GCP with auto-discovery (recommended - searches ALL accessible projects)
infrasee gcp config --auto-discover --token "your_access_token"
# OR with Service Account key
infrasee gcp config --auto-discover --service-account-key /path/to/key.json

# Configure GCP with manual project selection
infrasee gcp config --project-id "my-project-123" --token "your_access_token"
# OR configure multiple projects manually
infrasee gcp config --project-ids "project-1,project-2,project-3" --token "your_access_token"
# OR with Service Account key
infrasee gcp config --project-id "my-project-123" --service-account-key /path/to/key.json
```

Credentials are saved securely in `~/.infrasee/config.json`

## Usage

### Search All Services (Cloudflare + Coolify + DigitalOcean + GCP)

```bash
# Search all services at once
infrasee all ip 192.168.1.100

# Search all services INCLUDING all GCP projects (auto-discovery)
infrasee all ip 192.168.1.100 --all-projects

# Export to CSV for spreadsheets
infrasee all ip 192.168.1.100 --csv --output report.csv

# Get simple domain list
infrasee all ip 192.168.1.100 --simple

# Get full JSON data with all GCP projects
infrasee all ip 192.168.1.100 --all-projects --json --output data.json
```

### Cloudflare Only

```bash
# Basic search
infrasee cloudflare ip 104.26.2.33

# Simple domain list (IP as key)
infrasee cloudflare ip 104.26.2.33 --simple

# Full JSON output
infrasee cloudflare ip 104.26.2.33 --json --output cf-results.json

# Test connection
infrasee cloudflare test
```

### Coolify Only

```bash
# Basic search
infrasee coolify ip 192.168.1.100

# Simple domain list
infrasee coolify ip 192.168.1.100 --simple

# JSON output
infrasee coolify ip 192.168.1.100 --json
```

### DigitalOcean Only

```bash
# Basic search - finds droplets, load balancers, floating IPs, and domain records
infrasee digitalocean ip 165.227.123.45

# Simple resource list
infrasee digitalocean ip 165.227.123.45 --simple

# JSON output with full details
infrasee digitalocean ip 165.227.123.45 --json --output do-resources.json
```

### Google Cloud Platform (GCP)

```bash
# Search across ALL accessible projects (auto-discovery) - RECOMMENDED
infrasee gcp ip 35.190.247.123 --all-projects

# Search only manually configured projects
infrasee gcp ip 35.190.247.123

# Simple structured output
infrasee gcp ip 35.190.247.123 --simple

# JSON output with full details (includes project ID for each resource)
infrasee gcp ip 35.190.247.123 --json --output gcp-resources.json

# Test connection to all configured projects
infrasee gcp test
```

#### GCP Auto-Discovery (Recommended)

The `--all-projects` flag automatically discovers and searches ALL GCP projects your service account has access to. **No need to manually list project IDs!**

```bash
# Search ALL your GCP projects automatically - no configuration needed!
infrasee gcp ip 35.190.247.123 --all-projects

# Or use with the 'all' command to search every provider AND every GCP project
infrasee all ip 35.190.247.123 --all-projects

# Enable auto-discovery by default (environment variable)
export GCP_AUTO_DISCOVER=true
infrasee gcp ip 35.190.247.123
```

**Benefits:**
- 🚀 No need to manually maintain project ID lists
- 🔍 Automatically finds resources in ALL your projects
- 🆕 Discovers new projects as they're created
- ⚡ Perfect for organizations with many projects

**Requirements for Auto-Discovery:**
- Service account needs `resourcemanager.projects.list` permission
- Can be granted via the "Project Viewer" role or custom role
- Works with both access tokens and service account keys

### Test Connections

```bash
# Test Cloudflare connection
infrasee cloudflare test

# Test Coolify connection
infrasee coolify test

# Test DigitalOcean connection
infrasee digitalocean test

# Test GCP connection
infrasee gcp test
```

### Get Help

```bash
infrasee --help
infrasee ip --help
infrasee coolify --help
infrasee digitalocean --help
infrasee all --help
```

## API Requirements

### Cloudflare API

#### How to Get Your Cloudflare API Token

1. **API Token** (Recommended)
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Custom token" template
   - Set permissions:
     - Zone → Zone → Read
     - Zone → DNS → Read
   - Zone Resources: Include → All zones
   - Click "Continue to summary"
   - Click "Create Token"
   - Copy the token immediately (it won't be shown again)

2. **Global API Key** + Email (Alternative)
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Scroll to "API Keys" section
   - Click "View" next to Global API Key
   - Enter your password to view the key
   - Use with your Cloudflare account email

### Coolify API

#### How to Get Your Coolify API Token

1. **API Token**
   - Log in to your Coolify dashboard
   - Click on your profile icon (top right)
   - Go to "Settings"
   - Navigate to "API Tokens" section
   - Click "Generate New Token"
   - Give it a name (e.g., "InfraSee CLI")
   - Copy the token immediately (it won't be shown again)
   - **Note**: The tool only uses read-only endpoints, no write permissions needed

### DigitalOcean API

#### How to Get Your DigitalOcean API Token

1. **Personal Access Token**
   - Go to: https://cloud.digitalocean.com/account/api/tokens
   - Click "Generate New Token"
   - Token name: "InfraSee CLI" (or any name you prefer)
   - Expiration: Choose "No expiry" or set a custom date
   - Scopes: Select **Read** only (for security)
   - Click "Generate Token"
   - Copy the token immediately (it won't be shown again)
   - **What it searches:**
     - Droplets
     - Load Balancers
     - Floating IPs
     - Domain Records (A/AAAA)

### Google Cloud Platform API

#### How to Get Your GCP Credentials

##### Option 1: Access Token (Quick Setup, Short-lived)
1. **Install gcloud CLI** (if not already installed)
   - Download from: https://cloud.google.com/sdk/docs/install
   - Run: `gcloud init` to authenticate
2. **Generate Access Token**
   ```bash
   gcloud auth print-access-token
   ```
   - Copy the token (valid for 1 hour)
   - Use with: `infrasee gcp config --auto-discover --token "YOUR_TOKEN"`

##### Option 2: Service Account Key (Recommended for Long-term Use)
1. **Create Service Account**
   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
   - Click "Create Service Account"
   - Name: "infrasee-cli" (or your preference)
   - Click "Create and Continue"

2. **Grant Permissions**
   - Add these roles (minimum required):
     - **Viewer** (for basic read access)
     - **Cloud Resource Manager → Project Viewer** (for auto-discovery)
   - Click "Continue" then "Done"

3. **Create Key**
   - Click on your new service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON" format
   - Save the file securely (e.g., `~/gcp-key.json`)
   - Use with: `infrasee gcp config --auto-discover --service-account-key ~/gcp-key.json`

4. **Enable Required APIs** (if not already enabled)
   - Go to: https://console.cloud.google.com/apis/library
   - Enable these APIs:
     - Compute Engine API
     - Cloud Run API
     - Kubernetes Engine API
     - Cloud Resource Manager API (for auto-discovery)

**What it searches:**
- Compute Engine instances
- Load Balancers (forwarding rules)
- Cloud Run services
- GKE clusters

## Command Structure

InfraSee follows a consistent command pattern across all providers:

```
infrasee <provider> <command> [options]
```

### Providers
- `cloudflare` - Cloudflare DNS records
- `coolify` - Coolify applications and services
- `digitalocean` - DigitalOcean resources
- `gcp` - Google Cloud Platform resources
- `all` - Search all configured providers

### Commands
- `ip <address>` - Find resources using specific IP
- `config` - Configure provider credentials
- `test` - Test provider connection

### Examples
```bash
# Cloudflare commands
infrasee cloudflare ip 104.26.2.33
infrasee cloudflare config --token "your_token"
infrasee cloudflare test

# Same pattern for all providers
infrasee digitalocean ip 165.227.123.45
infrasee gcp ip 35.190.247.123
infrasee coolify ip 192.168.1.100
```

### Backward Compatibility

For backward compatibility, the following deprecated commands are still supported but will show deprecation warnings:

- `infrasee ip` → Use `infrasee cloudflare ip`
- `infrasee config` → Use `infrasee cloudflare config`
- `infrasee test` → Use `infrasee cloudflare test`

These deprecated commands will be removed in v2.0.0.

## Security

### Credential Storage

- Credentials are encrypted with AES-256 encryption (v1.1.0+)
- Config stored in `~/.infrasee/config.json` with restricted permissions
- Tokens are masked when displayed
- Automatic migration from plain text for older versions

### Best Practices

- Use API tokens with minimal required permissions (read-only)
- Don't commit credentials to git
- Use environment variables or .env files for sensitive data
- Rotate tokens periodically

## Output Examples

### Standard Output
```
# Cloudflare
Found 3 domain(s) using IP 192.168.1.100:

Zone: example.com
  → example.com [A] ✓ Proxied
    TTL: Auto
  → www.example.com [A] ✓ Proxied
    TTL: Auto

# DigitalOcean
Found 2 DigitalOcean resource(s) using IP 192.168.1.100:

Droplets:
  → web-server-01
    IP: 192.168.1.100
    Region: New York 3
    Status: active

Load Balancers:
  → production-lb
    IP: 192.168.1.100
    Region: New York 3
    Status: active
```

### Simple Output (`--simple`)
```json
{
  "192.168.1.100": [
    "example.com",
    "www.example.com",
    "api.example.com"
  ]
}
```

### CSV Output (`--csv`)
```csv
IP,Domain,Service Provider,In Coolify,In DigitalOcean
192.168.1.100,example.com,cloudflare,No,No
192.168.1.100,app.example.com,coolify,Yes,No
192.168.1.100,api.example.com,cloudflare+digitalocean,No,Yes
192.168.1.100,db.example.com,all,Yes,Yes
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Run directly
npm start ip 104.26.2.33
```

## Acknowledgments

### Special Thanks

- **[Coolify Team](https://github.com/coollabsio/coolify)** - For creating an amazing open-source PaaS that makes self-hosting simple and powerful. Coolify is a fantastic alternative to Heroku/Netlify/Vercel that respects your data privacy.
  - Repository: https://github.com/coollabsio/coolify
  - Website: https://coolify.io

- **[Cloudflare](https://www.cloudflare.com)** - For providing robust APIs and excellent developer documentation.

- **[DigitalOcean](https://www.digitalocean.com)** - For their comprehensive API and developer-friendly cloud infrastructure platform.

### Technologies Used

- **Node.js 18+** & **TypeScript 5.x** - Modern JavaScript with native fetch API
- **Commander.js** - Elegant command-line interface framework
- **Native Fetch** - Zero-dependency HTTP client using Node.js built-in fetch
- **Chalk** & **Ora** - Beautiful terminal output and spinners
- **Crypto-JS** - AES-256 encryption for secure credential storage

## Troubleshooting

### Token with Special Characters

If your API token contains special characters like `|`, `&`, or `$`, always wrap it in quotes:

```bash
# ❌ Wrong - shell will interpret the pipe character
infrasee coolify config --token 1|abc123xyz

# ✅ Correct - token is properly quoted
infrasee coolify config --token "1|abc123xyz"
```

### Common Issues

1. **"Command not found"** - Run `npm link` again from the project directory
2. **"No credentials found"** - Check your `.env` file or run the config commands
3. **Fish shell pipe error** - Quote your tokens as shown above
4. **Permission denied** - Some installation methods may require `sudo`
5. **GCP token expired** - Access tokens are valid for 1 hour. Generate a new one:
   ```bash
   export GCP_ACCESS_TOKEN=$(gcloud auth print-access-token)
   # Or reconfigure
   infrasee gcp config --auto-discover --token "$(gcloud auth print-access-token)"
   ```
6. **Too many GCP errors** - These are normal for projects without APIs enabled. To debug:
   ```bash
   DEBUG_GCP=true infrasee gcp ip 192.168.1.100 --all-projects
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## Roadmap

### Next Release (v1.6.0)
- **Huawei Cloud integration**
  - Search Elastic Cloud Server (ECS) instances
  - Search Elastic IPs (EIP)
  - Search Elastic Load Balancers (ELB)
  - Search Cloud Container Engine (CCE) clusters
  - Search DNS records
  - Authentication via Access Key ID (AK) / Secret Access Key (SK)

### Future Releases
- Hetzner Cloud integration
- AWS integration
  - EC2 instances
  - Elastic IPs
  - Route53 DNS records
  - Application Load Balancers
- Azure integration
  - Virtual Machines
  - Public IPs
  - Azure DNS
  - Load Balancers
- Alibaba Cloud integration
- NPM package publishing
- Homebrew formula
- Batch IP processing from file
- Export results to Excel format
- Web dashboard for results visualization

## Version History

### v1.5.4 (Current)
- Quieter GCP error handling for projects without API access
- Added GCP auto-discovery support to 'all' command
- Improved documentation and token instructions

### v1.5.3
- GCP auto-discovery across all accessible projects
- Added `--all-projects` flag

### v1.5.2
- Structured JSON output for `--simple` flag
- Provider-separated results

### v1.5.1
- Reorganized command structure
- Cloudflare commands now under subcommand

### v1.5.0
- Multi-project support for GCP
- Project IDs shown in results

### v1.4.0
- Added Google Cloud Platform support
- Search Compute Engine, Cloud Run, GKE, and Load Balancers

### v1.3.0
- Added DigitalOcean integration
- Search droplets, load balancers, floating IPs, and domains
- Pagination support for large infrastructures

### v1.2.0
- Replaced Axios with native fetch API
- Node.js 18+ requirement
- Reduced dependencies

### v1.1.0
- Added AES-256 encryption for credentials
- Machine-specific encryption keys
- Automatic migration from plain text
- Token masking in output

### v1.0.0
- Initial release with Cloudflare DNS search
- Coolify integration for deployment search
- Multiple output formats (JSON, CSV, simple)
- Configuration via environment variables or .env files

## License

MIT

---

**Note**: This tool is not affiliated with Cloudflare, Coolify, DigitalOcean, or Google Cloud Platform. It uses their public APIs. 