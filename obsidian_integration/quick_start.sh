#!/bin/bash
# NEXA-Obsidian Integration Quick Start Script
# This script helps you get started with the NEXA-Obsidian integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           NEXA-Obsidian Integration Quick Start             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[!] Python 3 is not installed. Please install Python 3.7+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}[+] Python 3 found: $(python3 --version)${NC}"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}[!] pip3 is not installed. Please install pip3 first.${NC}"
    exit 1
fi

echo -e "${GREEN}[+] pip3 found${NC}"

# Install Python dependencies
echo -e "${YELLOW}[*] Installing Python dependencies...${NC}"
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[+] Python dependencies installed successfully${NC}"
else
    echo -e "${RED}[!] Failed to install Python dependencies${NC}"
    exit 1
fi

# Make scripts executable
echo -e "${YELLOW}[*] Making scripts executable...${NC}"
chmod +x nexa_parser.py
chmod +x obsidian_integration.py
chmod +x example_usage.py

echo -e "${GREEN}[+] Scripts made executable${NC}"

# Create example configuration
echo -e "${YELLOW}[*] Creating example configuration...${NC}"

cat > example_config.json << EOF
{
  "obsidian_vault_path": "/path/to/your/obsidian/vault",
  "nexa_output_directory": "/path/to/nexa/output",
  "target_name": "example-target",
  "tester": "Your Name",
  "scope": "Full scope penetration test",
  "methodology": "OWASP"
}
EOF

echo -e "${GREEN}[+] Example configuration created: example_config.json${NC}"

# Test the parser
echo -e "${YELLOW}[*] Testing NEXA parser...${NC}"
python3 nexa_parser.py --help 2>/dev/null || echo -e "${YELLOW}[!] Parser test skipped (no NEXA output available)${NC}"

# Test the integration script
echo -e "${YELLOW}[*] Testing integration script...${NC}"
python3 obsidian_integration.py --help 2>/dev/null || echo -e "${YELLOW}[!] Integration test skipped${NC}"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Setup Complete!                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update example_config.json with your actual paths"
echo "2. Run NEXA to generate reconnaissance results"
echo "3. Use the integration script to import results into Obsidian"
echo ""
echo -e "${YELLOW}Example usage:${NC}"
echo "python3 obsidian_integration.py \\"
echo "  --vault /path/to/obsidian/vault \\"
echo "  --nexa-output /path/to/nexa/output \\"
echo "  --target \"company-website\" \\"
echo "  --action create-note"
echo ""
echo -e "${YELLOW}For more examples, run:${NC}"
echo "python3 example_usage.py"
echo ""
echo -e "${GREEN}Happy pentesting! 🚀${NC}"
