# InfraSee CLI v1.3.0

A **modern**, **secure**, and **blazing-fast** CLI tool to find all domains and resources using a specific IP address across Cloudflare DNS, Coolify deployments, and DigitalOcean infrastructure.

## ⚡ Performance & Modern Stack (New in v1.2.0)

- **Native Fetch API**: Replaced Axios with native Node.js fetch for zero external HTTP dependencies
- **Node.js 18+ Required**: Leveraging modern JavaScript features
- **ES2023 Target**: Using latest TypeScript compilation target
- **Optimized Bundle**: Reduced runtime dependencies from 10 to 5 packages
- **Faster Execution**: Native APIs provide better performance

## 🔐 Security Features (v1.1.0)

- **Encrypted Credential Storage**: API tokens are encrypted using AES-256 encryption
- **Machine-Specific Encryption**: Each machine uses a unique encryption key
- **Secure File Permissions**: Config files are saved with restricted permissions (0600)
- **Token Masking**: Sensitive data is masked when displayed
- **Backward Compatibility**: Automatic migration from plain text to encrypted storage

## Features

- ⚡ **Lightning Fast**: Native fetch API with zero external HTTP dependencies (v1.2.0)
- 🔍 **Multi-Cloud Search**: Find domains in Cloudflare DNS, Coolify, and DigitalOcean
- 🔐 **Military-Grade Security**: AES-256 encrypted credential storage
- 📊 **Multiple Output Formats**: JSON, CSV, simple lists, or formatted display
- 🎯 **Combined Search**: Search all three services simultaneously with `all` command
- 📁 **Flexible Configuration**: Environment variables, .env files, or encrypted config
- 🎨 **Beautiful CLI Output**: Colored output with progress indicators
- 💾 **Export Options**: Save results to files in any format
- 📈 **CSV Export**: Perfect for Google Sheets/Excel reports
- 🚀 **Modern Stack**: Node.js 18+, TypeScript 5.x, ES2023 target

## Quick Start

```bash
# Clone and install with one command
git clone https://github.com/DreamsEngine/infrasee-cli.git
cd infrasee-cli
./install.sh

# Configure your API tokens
echo "CLOUDFLARE_API_TOKEN=your_token" >> .env
echo "COOLIFY_API_TOKEN=your_token" >> .env
echo "DIGITALOCEAN_TOKEN=your_token" >> .env

# Search for domains
infrasee all ip 192.168.1.100 --csv --output report.csv
```

Or manually:
```bash
git clone https://github.com/DreamsEngine/infrasee-cli.git
cd infrasee-cli
npm install && npm run build && npm link
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
> brew tap DreamsEngine/infrasee
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
```

#### Method 3: Interactive Configuration

```bash
# Configure Cloudflare
infrasee config --token "your_api_token_here"

# Configure Coolify (note: always quote tokens with special characters like |)
infrasee coolify config --token "your_coolify_token" --url https://your-coolify.com

# Configure DigitalOcean
infrasee digitalocean config --token "your_digitalocean_token"
```

Credentials are saved securely in `~/.infrasee/config.json`

## Usage

### Search All Services (Cloudflare + Coolify + DigitalOcean)

```bash
# Search all three services at once
infrasee all ip 192.168.1.100

# Export to CSV for spreadsheets
infrasee all ip 192.168.1.100 --csv --output report.csv

# Get simple domain list
infrasee all ip 192.168.1.100 --simple

# Get full JSON data
infrasee all ip 192.168.1.100 --json --output data.json
```

### Cloudflare Only

```bash
# Basic search
infrasee ip 104.26.2.33

# Simple domain list (IP as key)
infrasee ip 104.26.2.33 --simple

# Full JSON output
infrasee ip 104.26.2.33 --json --output cf-results.json
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

### Test Connections

```bash
# Test Cloudflare connection
infrasee test

# Test Coolify connection
infrasee coolify test

# Test DigitalOcean connection
infrasee digitalocean test
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

1. **API Token** (Recommended)
   - Create at: https://dash.cloudflare.com/profile/api-tokens
   - Required permissions:
     - Zone:Read
     - DNS:Read

2. **Global API Key** + Email
   - Find at: https://dash.cloudflare.com/profile/api-tokens
   - Uses your account email and global API key

### Coolify API

1. **API Token**
   - Generate in your Coolify dashboard under Settings → API Tokens
   - The tool uses **read-only** endpoints
   - No write permissions needed

### DigitalOcean API

1. **Personal Access Token**
   - Create at: https://cloud.digitalocean.com/account/api/tokens
   - Required scope: **Read** (read-only access)
   - The tool searches:
     - Droplets
     - Load Balancers
     - Floating IPs
     - Domain Records (A/AAAA)

## Security Best Practices

### Credential Security (v1.1.0+)

1. **Automatic Encryption**: All stored credentials are automatically encrypted
2. **Machine-Specific Keys**: Encryption keys are unique to each machine
3. **Secure Storage Location**: `~/.infrasee/config.json` with 0600 permissions
4. **Token Masking**: Tokens are masked when displayed (e.g., `CEB***-d`)

### General Security

1. **Use API Tokens instead of Global API Keys** - Tokens can be scoped with minimal permissions
2. **Never commit credentials** - Use environment variables or .env files (which are gitignored)
3. **Rotate credentials regularly** - Update your tokens/keys periodically
4. **Use read-only permissions** - This tool only needs read access
5. **Keep the tool updated** - Regular updates include security improvements

### Encrypted vs Plain Text Storage

- **v1.1.0+**: Credentials are encrypted by default
- **v1.0.x**: Plain text storage (legacy)
- **Migration**: Automatic when you run any command with v1.1.0+

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## Roadmap

### v1.4.0 (Coming Soon)
- [ ] **Hetzner Cloud Integration** - Search servers and load balancers by IP
- [ ] **Linode Integration** - Find compute instances and NodeBalancers
- [ ] **Vultr Integration** - Search instances and bare metal servers
- [ ] Enhanced filtering and search options

### Future Releases
- [ ] AWS Route53 support
- [ ] Google Cloud DNS integration
- [ ] Azure DNS support
- [ ] Publish to NPM registry
- [ ] Create Homebrew formula
- [ ] Add reverse lookup (domain to IP)
- [ ] Interactive mode with prompts
- [ ] Batch IP processing from file
- [ ] Web dashboard (optional)

## Version History

### v1.3.0 (Current)
- 🌊 **DigitalOcean Integration** - Search droplets, load balancers, floating IPs, and domains
- 🔍 Multi-cloud search across Cloudflare, Coolify, and DigitalOcean
- 📊 Enhanced CSV export with all three services
- 🔐 Encrypted storage for DigitalOcean tokens
- ⚡ Pagination support for large DigitalOcean infrastructures

### v1.2.0
- ⚡ Replaced Axios with native fetch API (Node.js 18+)
- 📦 Reduced dependencies from 10 to 5 packages
- 🚀 Modernized to ES2023 and TypeScript 5.x
- 🔧 Optimized bundle size and performance
- ✨ Zero external HTTP dependencies

### v1.1.0
- 🔐 AES-256 encryption for credential storage
- 🔑 Machine-specific encryption keys
- ✅ Integrity verification with checksums
- 🔄 Automatic migration from plain text
- 👁️ Token masking in CLI output

### v1.0.0
- 🔍 Initial release with Cloudflare DNS search
- 🎯 Coolify integration for deployment search
- 📊 Multiple output formats (JSON, CSV, simple)
- 🎨 Beautiful CLI with colors and progress indicators
- 📁 Flexible configuration options

## License

MIT

## Author

Created with ❤️ for the DevOps and self-hosting community.

---

**Note**: This tool is not affiliated with Cloudflare or Coolify. It's an independent project that uses their public APIs.