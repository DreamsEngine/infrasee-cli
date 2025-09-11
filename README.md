# Dreamsflare CLI

A powerful CLI tool to find all domains using a specific IP address across Cloudflare DNS and Coolify deployments.

## Features

- 🔍 **Dual Service Search**: Find domains in both Cloudflare DNS and Coolify
- 🔐 **Secure API Management**: Support for API tokens with read-only access
- 📊 **Multiple Output Formats**: JSON, CSV, simple lists, or formatted display
- 🎯 **Combined Search**: Search both services simultaneously with `all` command
- 📁 **Flexible Configuration**: Environment variables, .env files, or config files
- 🎨 **Beautiful CLI Output**: Colored output with progress indicators
- 💾 **Export Options**: Save results to files in any format
- 📈 **CSV Export**: Perfect for Google Sheets/Excel reports

## Quick Start

```bash
# Clone and install with one command
git clone https://github.com/yourusername/dreamsflare.git
cd dreamsflare
./install.sh

# Configure your API tokens
echo "CLOUDFLARE_API_TOKEN=your_token" >> .env
echo "COOLIFY_API_TOKEN=your_token" >> .env

# Search for domains
dreamsflare all ip 192.168.1.100 --csv --output report.csv
```

Or manually:
```bash
git clone https://github.com/yourusername/dreamsflare.git
cd dreamsflare
npm install && npm run build && npm link
```

## Installation

### Option 1: Global Installation via npm link (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/dreamsflare.git
cd dreamsflare

# Install dependencies
npm install

# Build the TypeScript project
npm run build

# Create global symlink (makes 'dreamsflare' command available globally)
npm link
```

### Option 2: Install to /usr/local/bin (macOS/Linux)

```bash
# Clone and build
git clone https://github.com/yourusername/dreamsflare.git
cd dreamsflare
npm install && npm run build

# Create executable script
echo '#!/usr/bin/env node' > dreamsflare-cli
echo "require('$(pwd)/dist/cli.js')" >> dreamsflare-cli
chmod +x dreamsflare-cli

# Move to global bin (may require sudo)
sudo mv dreamsflare-cli /usr/local/bin/dreamsflare
```

### Option 3: Add to PATH

```bash
# Clone and build
git clone https://github.com/yourusername/dreamsflare.git
cd dreamsflare
npm install && npm run build

# Add to your shell config (~/.zshrc, ~/.bashrc, or ~/.config/fish/config.fish)
echo "export PATH=\"\$PATH:$(pwd)/dist\"" >> ~/.zshrc
source ~/.zshrc

# Create alias
echo "alias dreamsflare='node $(pwd)/dist/cli.js'" >> ~/.zshrc
source ~/.zshrc
```

### Homebrew Installation (Coming Soon)

> 🚧 **Note**: We're working on a Homebrew formula for easy installation:
> ```bash
> # Future installation method
> brew tap yourusername/dreamsflare
> brew install dreamsflare
> ```

### NPM Package (Planned)

> 📦 **Note**: NPM package publishing is planned for a future release:
> ```bash
> # Future installation method
> npm install -g dreamsflare
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
```

#### Method 3: Interactive Configuration

```bash
# Configure Cloudflare
dreamsflare config --token your_api_token_here

# Configure Coolify
dreamsflare coolify config --token your_coolify_token --url https://your-coolify.com
```

Credentials are saved securely in `~/.dreamsflare/config.json`

## Usage

### Search Both Services (Cloudflare + Coolify)

```bash
# Search both services at once
dreamsflare all ip 192.168.1.100

# Export to CSV for spreadsheets
dreamsflare all ip 192.168.1.100 --csv --output report.csv

# Get simple domain list
dreamsflare all ip 192.168.1.100 --simple

# Get full JSON data
dreamsflare all ip 192.168.1.100 --json --output data.json
```

### Cloudflare Only

```bash
# Basic search
dreamsflare ip 104.26.2.33

# Simple domain list (IP as key)
dreamsflare ip 104.26.2.33 --simple

# Full JSON output
dreamsflare ip 104.26.2.33 --json --output cf-results.json
```

### Coolify Only

```bash
# Basic search
dreamsflare coolify ip 192.168.1.100

# Simple domain list
dreamsflare coolify ip 192.168.1.100 --simple

# JSON output
dreamsflare coolify ip 192.168.1.100 --json
```

### Test Connections

```bash
# Test Cloudflare connection
dreamsflare test

# Test Coolify connection
dreamsflare coolify test
```

### Get Help

```bash
dreamsflare --help
dreamsflare ip --help
dreamsflare coolify --help
dreamsflare all --help
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

## Security Best Practices

1. **Use API Tokens instead of Global API Keys** - Tokens can be scoped with minimal permissions
2. **Never commit credentials** - Use environment variables or .env files (which are gitignored)
3. **Rotate credentials regularly** - Update your tokens/keys periodically
4. **Use read-only permissions** - This tool only needs read access to zones and DNS records

## Output Examples

### Standard Output
```
Found 3 domain(s) using IP 192.168.1.100:

Zone: example.com
  → example.com [A] ✓ Proxied
    TTL: Auto
  → www.example.com [A] ✓ Proxied
    TTL: Auto
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
IP,Domain,DNS Provider,In Coolify
192.168.1.100,example.com,cloudflare,No
192.168.1.100,app.example.com,coolify,Yes
192.168.1.100,api.example.com,both,Yes
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

### Technologies Used

- **Node.js** & **TypeScript** - For a type-safe, modern development experience
- **Commander.js** - Elegant command-line interface framework
- **Axios** - Reliable HTTP client for API requests
- **Chalk** & **Ora** - Beautiful terminal output and spinners

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## Roadmap

- [ ] Publish to NPM registry
- [ ] Create Homebrew formula
- [ ] Add support for more DNS providers
- [ ] Add reverse lookup (domain to IP)
- [ ] Interactive mode with prompts
- [ ] Batch IP processing from file
- [ ] Web dashboard (optional)

## License

MIT

## Author

Created with ❤️ for the DevOps and self-hosting community.

---

**Note**: This tool is not affiliated with Cloudflare or Coolify. It's an independent project that uses their public APIs.