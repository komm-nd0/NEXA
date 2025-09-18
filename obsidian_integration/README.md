# NEXA-Obsidian Integration

A comprehensive integration solution that automatically imports NEXA (Network Enumeration & xXposure Analyzer) reconnaissance results into Obsidian for organized penetration testing documentation.

## 🎯 Overview

This integration bridges the gap between automated reconnaissance tools and manual penetration testing documentation by:

- **Parsing NEXA output files** (nmap scans, web enumeration, AD enumeration)
- **Generating structured Obsidian notes** with reconnaissance data
- **Creating pentest templates** for consistent documentation
- **Updating existing notes** with new reconnaissance findings
- **Organizing data** in a searchable, linkable format

## 📁 Project Structure

```
obsidian_integration/
├── nexa_parser.py              # Core parser for NEXA output files
├── obsidian_integration.py     # Main integration script
├── nexa_obsidian_plugin.js     # Obsidian community plugin
├── requirements.txt            # Python dependencies
├── package.json               # Node.js dependencies for plugin
├── manifest.json              # Obsidian plugin manifest
└── README.md                  # This documentation
```

## 🚀 Quick Start

### Method 1: Python Script (Recommended)

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the integration:**
   ```bash
   python3 obsidian_integration.py \
     --vault /path/to/your/obsidian/vault \
     --nexa-output /path/to/nexa/output/directory \
     --target "company-website" \
     --action create-note
   ```

### Method 2: Obsidian Plugin

1. **Install the plugin:**
   - Copy the plugin files to your Obsidian vault's `.obsidian/plugins/nexa-integration/` directory
   - Enable the plugin in Obsidian settings

2. **Use the plugin:**
   - Click the NEXA icon in the ribbon
   - Or use the command palette: "NEXA Integration"

## 📋 Features

### 🔍 NEXA Output Parsing

The integration parses all NEXA output files:

- **Nmap Scans**: Basic, aggressive, and stealth scans
- **Web Enumeration**: Directory discovery, vulnerability scanning, subdomain enumeration
- **Active Directory**: SMB enumeration, LDAP queries, Kerberos enumeration
- **Summary Reports**: Comprehensive enumeration summaries

### 📝 Obsidian Note Generation

Creates structured markdown notes with:

- **Target Information**: Scan metadata and timestamps
- **Network Reconnaissance**: Open ports, services, OS detection
- **Web Application Data**: Subdomains, directories, vulnerabilities
- **Active Directory Info**: Shares, users, domain structure
- **Formatted Tables**: Easy-to-read data presentation

### 🎨 Pentest Templates

Pre-built templates for:

- **Comprehensive pentest notes** with all standard sections
- **Reconnaissance tracking** with NEXA integration points
- **Vulnerability assessment** checklists
- **Exploitation tracking** with success/failure indicators
- **Reporting sections** for executive and technical summaries

### 🔄 Note Updates

- **Update existing notes** with new reconnaissance data
- **Preserve manual findings** while adding automated results
- **Link to detailed NEXA results** for reference
- **Maintain note structure** and formatting

## 🛠️ Installation

### Prerequisites

- Python 3.7+ (for script-based integration)
- Node.js 16+ (for Obsidian plugin)
- Obsidian application
- NEXA tool with completed scans

### Python Dependencies

```bash
pip install -r requirements.txt
```

### Obsidian Plugin Setup

1. **Create plugin directory:**
   ```bash
   mkdir -p /path/to/vault/.obsidian/plugins/nexa-integration
   ```

2. **Copy plugin files:**
   ```bash
   cp nexa_obsidian_plugin.js /path/to/vault/.obsidian/plugins/nexa-integration/main.js
   cp manifest.json /path/to/vault/.obsidian/plugins/nexa-integration/manifest.json
   ```

3. **Enable in Obsidian:**
   - Go to Settings → Community Plugins
   - Enable "NEXA Integration"

## 📖 Usage Examples

### Create New Pentest Note

```bash
python3 obsidian_integration.py \
  --vault ~/Documents/ObsidianVault \
  --nexa-output ~/pentest/enum_results_20231201_143022 \
  --target "company-website" \
  --action create-note \
  --tester "John Doe" \
  --scope "Full scope penetration test" \
  --methodology "OWASP"
```

### Update Existing Note

```bash
python3 obsidian_integration.py \
  --vault ~/Documents/ObsidianVault \
  --nexa-output ~/pentest/enum_results_20231201_143022 \
  --target "company-website" \
  --action update-note \
  --note-path "Pentest_Notes/Company_Website_20231201.md"
```

### Copy NEXA Files to Vault

```bash
python3 obsidian_integration.py \
  --vault ~/Documents/ObsidianVault \
  --nexa-output ~/pentest/enum_results_20231201_143022 \
  --target "company-website" \
  --action copy-files
```

## 🎨 Generated Note Structure

### Pentest Note Template

```markdown
# Company Website - Penetration Test

## 📋 Test Information
- **Target:** `company-website`
- **Test Date:** 2023-12-01
- **Tester:** John Doe
- **Scope:** Full scope penetration test
- **Methodology:** OWASP

## 🎯 Reconnaissance Results
**Status:** Completed

### Basic Nmap Scan
- **Host Status:** Up
- **Operating System:** Linux 3.x
- **Open Ports:** 5

### Web Application Summary
- **Subdomains Found:** 3
- **Directories Found:** 12
- **Vulnerabilities Found:** 2

### Active Directory Summary
- **SMB Shares:** 0
- **Users Found:** 0

## 🔍 Vulnerability Assessment
<!-- Manual testing results go here -->

### Critical Findings
- [ ] Finding 1
- [ ] Finding 2

### High Findings
- [ ] Finding 1
- [ ] Finding 2

## 🎯 Exploitation
<!-- Exploitation attempts and results -->

## 📊 Post-Exploitation
<!-- Post-exploitation activities -->

## 📝 Reporting
<!-- Report generation and findings -->

## 🔗 References
- [NEXA Results](NEXA_Results_company-website_20231201_143022.md)
- [Tools Used](#tools-used)
- [Methodology](#methodology)

## 🛠️ Tools Used
- NEXA (Network Enumeration & xXposure Analyzer)
- Nmap
- Gobuster
- Nuclei
- enum4linux-ng
- NetExec (nxc)
```

### NEXA Results Note

```markdown
# NEXA Reconnaissance Results

**Generated:** 2023-12-01T14:30:22

## 🎯 Target Information
- **Output Directory:** `/path/to/enum_results_20231201_143022`
- **Scan Date:** 20231201_143022

## 🔍 Network Reconnaissance

### Basic Nmap Scan
- **Host Status:** Up
- **Operating System:** Linux 3.x
- **Open Ports:** 5

| Port | Service | Version |
|------|---------|---------|
| 22   | ssh     | OpenSSH 8.2p1 |
| 80   | http    | Apache 2.4.41 |
| 443  | https   | Apache 2.4.41 |

## 🌐 Web Application Enumeration

### Subdomains
- `www.company.com`
- `api.company.com`
- `admin.company.com`

### Discovered Directories
| Path | Status | Size |
|------|--------|------|
| `/admin` | 200 | 1024 |
| `/api` | 200 | 2048 |
| `/backup` | 403 | 0 |

### Vulnerabilities
| Severity | URL | Description |
|----------|-----|-------------|
| medium | https://company.com/admin | Admin panel accessible |
| low | https://company.com/backup | Directory listing enabled |

## 🏢 Active Directory Enumeration
<!-- AD enumeration results if applicable -->
```

## 🔧 Configuration

### Obsidian Vault Structure

The integration expects the following directory structure:

```
ObsidianVault/
├── Pentest_Notes/           # Pentest notes directory
├── Templates/               # Note templates
├── Attachments/             # File attachments
│   └── NEXA_Results/       # NEXA output files
└── .obsidian/              # Obsidian configuration
    └── plugins/            # Community plugins
        └── nexa-integration/
```

### Customization

You can customize the integration by modifying:

- **Template files** in the `Templates/` directory
- **Parser logic** in `nexa_parser.py`
- **Note structure** in the integration scripts
- **Plugin behavior** in `nexa_obsidian_plugin.js`

## 🐛 Troubleshooting

### Common Issues

1. **Permission Errors**
   ```bash
   # Ensure proper permissions
   chmod +x obsidian_integration.py
   chmod +x nexa_parser.py
   ```

2. **Missing Dependencies**
   ```bash
   # Install Python dependencies
   pip install -r requirements.txt
   
   # For Node.js (plugin)
   npm install
   ```

3. **Path Issues**
   - Use absolute paths for vault and NEXA output directories
   - Ensure NEXA output directory contains expected files

4. **Obsidian Plugin Issues**
   - Check plugin is enabled in Obsidian settings
   - Verify plugin files are in correct directory
   - Check Obsidian console for error messages

### Debug Mode

Enable debug output:

```bash
python3 obsidian_integration.py --debug \
  --vault /path/to/vault \
  --nexa-output /path/to/nexa/output \
  --target "test-target"
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd NEXA/obsidian_integration

# Install development dependencies
pip install -r requirements-dev.txt

# Run tests
python -m pytest tests/

# Format code
black *.py
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **NEXA Team** for the excellent reconnaissance tool
- **Obsidian Community** for the plugin framework
- **Security Community** for feedback and contributions

## 📞 Support

For support and questions:

- **Issues**: Create an issue in the repository
- **Discussions**: Use GitHub Discussions
- **Documentation**: Check this README and inline comments

---

**Happy Pentesting! 🚀**
