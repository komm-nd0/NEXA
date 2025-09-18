#!/usr/bin/env python3
"""
NEXA Output Parser for Obsidian Integration
Parses NEXA enumeration results and formats them for Obsidian notes
"""

import os
import re
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

class NEXAParser:
    def __init__(self, output_dir: str):
        self.output_dir = Path(output_dir)
        self.parsed_data = {
            'target_info': {},
            'nmap_results': {},
            'web_enumeration': {},
            'ad_enumeration': {},
            'summary': {}
        }
    
    def parse_all(self) -> Dict[str, Any]:
        """Parse all NEXA output files in the directory"""
        if not self.output_dir.exists():
            raise FileNotFoundError(f"Output directory not found: {self.output_dir}")
        
        # Parse target information from directory name
        self._parse_target_info()
        
        # Parse different types of results
        self._parse_nmap_results()
        self._parse_web_enumeration()
        self._parse_ad_enumeration()
        self._parse_summary()
        
        return self.parsed_data
    
    def _parse_target_info(self):
        """Extract target information from directory structure"""
        dir_name = self.output_dir.name
        timestamp_match = re.search(r'(\d{8}_\d{6})', dir_name)
        
        self.parsed_data['target_info'] = {
            'scan_date': timestamp_match.group(1) if timestamp_match else 'unknown',
            'output_directory': str(self.output_dir),
            'scan_timestamp': datetime.now().isoformat()
        }
    
    def _parse_nmap_results(self):
        """Parse Nmap scan results"""
        nmap_files = {
            'basic': 'nmap_basic_scan.txt',
            'aggressive': 'nmap_aggressive_scan.txt',
            'stealth': 'nmap_stealth_scan.txt'
        }
        
        for scan_type, filename in nmap_files.items():
            file_path = self.output_dir / filename
            if file_path.exists():
                self.parsed_data['nmap_results'][scan_type] = self._parse_nmap_file(file_path)
    
    def _parse_nmap_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse individual Nmap file"""
        content = file_path.read_text()
        
        # Extract open ports
        open_ports = []
        port_pattern = r'(\d+)/tcp\s+open\s+(\w+)(?:\s+(.+))?'
        
        for line in content.split('\n'):
            match = re.search(port_pattern, line)
            if match:
                port, service, version = match.groups()
                open_ports.append({
                    'port': int(port),
                    'service': service,
                    'version': version.strip() if version else 'Unknown'
                })
        
        # Extract OS information
        os_info = 'Unknown'
        os_pattern = r'Running: (.+)'
        for line in content.split('\n'):
            match = re.search(os_pattern, line)
            if match:
                os_info = match.group(1)
                break
        
        # Extract host status
        host_status = 'Unknown'
        if 'Host is up' in content:
            host_status = 'Up'
        elif 'Host seems down' in content:
            host_status = 'Down'
        
        return {
            'host_status': host_status,
            'os_info': os_info,
            'open_ports': open_ports,
            'total_ports': len(open_ports),
            'raw_content': content
        }
    
    def _parse_web_enumeration(self):
        """Parse web enumeration results"""
        web_dir = self.output_dir / 'web_enumeration'
        if not web_dir.exists():
            return
        
        web_data = {}
        
        # Parse directory enumeration
        gobuster_file = web_dir / 'gobuster_dirs.txt'
        if gobuster_file.exists():
            web_data['directories'] = self._parse_gobuster_file(gobuster_file)
        
        # Parse Nuclei results
        nuclei_file = web_dir / 'nuclei_scan.txt'
        if nuclei_file.exists():
            web_data['vulnerabilities'] = self._parse_nuclei_file(nuclei_file)
        
        # Parse subdomains
        subdomains_file = web_dir / 'subdomains.txt'
        if subdomains_file.exists():
            web_data['subdomains'] = self._parse_subdomains_file(subdomains_file)
        
        self.parsed_data['web_enumeration'] = web_data
    
    def _parse_gobuster_file(self, file_path: Path) -> List[Dict[str, str]]:
        """Parse Gobuster directory enumeration results"""
        directories = []
        content = file_path.read_text()
        
        for line in content.split('\n'):
            if line.strip() and not line.startswith('='):
                parts = line.split()
                if len(parts) >= 3:
                    directories.append({
                        'path': parts[0],
                        'status': parts[1],
                        'size': parts[2] if len(parts) > 2 else 'Unknown'
                    })
        
        return directories
    
    def _parse_nuclei_file(self, file_path: Path) -> List[Dict[str, str]]:
        """Parse Nuclei vulnerability scan results"""
        vulnerabilities = []
        content = file_path.read_text()
        
        for line in content.split('\n'):
            if line.strip() and '[' in line and ']' in line:
                # Extract vulnerability info
                parts = line.split(']')
                if len(parts) >= 2:
                    severity = parts[0].replace('[', '').strip()
                    rest = parts[1].strip()
                    
                    # Extract URL and description
                    url_match = re.search(r'(https?://[^\s]+)', rest)
                    url = url_match.group(1) if url_match else 'Unknown'
                    
                    description = rest.replace(url, '').strip()
                    
                    vulnerabilities.append({
                        'severity': severity,
                        'url': url,
                        'description': description
                    })
        
        return vulnerabilities
    
    def _parse_subdomains_file(self, file_path: Path) -> List[str]:
        """Parse subdomains file"""
        try:
            return [line.strip() for line in file_path.read_text().split('\n') if line.strip()]
        except:
            return []
    
    def _parse_ad_enumeration(self):
        """Parse Active Directory enumeration results"""
        ad_dir = self.output_dir / 'ad_enumeration'
        if not ad_dir.exists():
            return
        
        ad_data = {}
        
        # Parse SMB enumeration
        smb_file = ad_dir / 'enum4linux-ng_smb.txt'
        if smb_file.exists():
            ad_data['smb'] = self._parse_smb_file(smb_file)
        
        # Parse LDAP enumeration
        ldap_file = ad_dir / 'ldap_enum.txt'
        if ldap_file.exists():
            ad_data['ldap'] = self._parse_ldap_file(ldap_file)
        
        # Parse Kerberos enumeration
        kerberos_file = ad_dir / 'kerberos_enum.txt'
        if kerberos_file.exists():
            ad_data['kerberos'] = self._parse_kerberos_file(kerberos_file)
        
        self.parsed_data['ad_enumeration'] = ad_data
    
    def _parse_smb_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse SMB enumeration results"""
        content = file_path.read_text()
        
        # Extract shares
        shares = []
        share_pattern = r'Share\s+(\w+)\s+\((.+)\)'
        for line in content.split('\n'):
            match = re.search(share_pattern, line)
            if match:
                shares.append({
                    'name': match.group(1),
                    'description': match.group(2)
                })
        
        # Extract users
        users = []
        user_pattern = r'User\s+(\w+)'
        for line in content.split('\n'):
            match = re.search(user_pattern, line)
            if match:
                users.append(match.group(1))
        
        return {
            'shares': shares,
            'users': list(set(users)),  # Remove duplicates
            'raw_content': content
        }
    
    def _parse_ldap_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse LDAP enumeration results"""
        content = file_path.read_text()
        
        # Extract base DN
        base_dn = 'Unknown'
        dn_pattern = r'defaultNamingContext:\s+(.+)'
        for line in content.split('\n'):
            match = re.search(dn_pattern, line)
            if match:
                base_dn = match.group(1)
                break
        
        return {
            'base_dn': base_dn,
            'raw_content': content
        }
    
    def _parse_kerberos_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse Kerberos enumeration results"""
        content = file_path.read_text()
        
        # Extract Kerberos realm
        realm = 'Unknown'
        realm_pattern = r'Realm:\s+(.+)'
        for line in content.split('\n'):
            match = re.search(realm_pattern, line)
            if match:
                realm = match.group(1)
                break
        
        return {
            'realm': realm,
            'raw_content': content
        }
    
    def _parse_summary(self):
        """Parse summary files"""
        summary_files = [
            'enumeration_summary.txt',
            'ad_enumeration_summary.txt'
        ]
        
        for filename in summary_files:
            file_path = self.output_dir / filename
            if file_path.exists():
                self.parsed_data['summary'][filename] = file_path.read_text()
    
    def to_obsidian_format(self) -> str:
        """Convert parsed data to Obsidian markdown format"""
        md_content = []
        
        # Header
        md_content.append("# NEXA Reconnaissance Results")
        md_content.append(f"**Scan Date:** {self.parsed_data['target_info']['scan_date']}")
        md_content.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        md_content.append("")
        
        # Target Information
        md_content.append("## 🎯 Target Information")
        md_content.append(f"- **Output Directory:** `{self.parsed_data['target_info']['output_directory']}`")
        md_content.append("")
        
        # Nmap Results
        if self.parsed_data['nmap_results']:
            md_content.append("## 🔍 Network Reconnaissance")
            
            for scan_type, results in self.parsed_data['nmap_results'].items():
                md_content.append(f"### {scan_type.title()} Nmap Scan")
                md_content.append(f"- **Host Status:** {results['host_status']}")
                md_content.append(f"- **Operating System:** {results['os_info']}")
                md_content.append(f"- **Open Ports:** {results['total_ports']}")
                
                if results['open_ports']:
                    md_content.append("")
                    md_content.append("| Port | Service | Version |")
                    md_content.append("|------|---------|---------|")
                    for port_info in results['open_ports']:
                        md_content.append(f"| {port_info['port']} | {port_info['service']} | {port_info['version']} |")
                
                md_content.append("")
        
        # Web Enumeration
        if self.parsed_data['web_enumeration']:
            md_content.append("## 🌐 Web Application Enumeration")
            
            web_data = self.parsed_data['web_enumeration']
            
            # Subdomains
            if 'subdomains' in web_data and web_data['subdomains']:
                md_content.append("### Subdomains")
                for subdomain in web_data['subdomains']:
                    md_content.append(f"- `{subdomain}`")
                md_content.append("")
            
            # Directories
            if 'directories' in web_data and web_data['directories']:
                md_content.append("### Discovered Directories")
                md_content.append("| Path | Status | Size |")
                md_content.append("|------|--------|------|")
                for directory in web_data['directories']:
                    md_content.append(f"| `{directory['path']}` | {directory['status']} | {directory['size']} |")
                md_content.append("")
            
            # Vulnerabilities
            if 'vulnerabilities' in web_data and web_data['vulnerabilities']:
                md_content.append("### Vulnerabilities")
                md_content.append("| Severity | URL | Description |")
                md_content.append("|----------|-----|-------------|")
                for vuln in web_data['vulnerabilities']:
                    md_content.append(f"| {vuln['severity']} | {vuln['url']} | {vuln['description']} |")
                md_content.append("")
        
        # Active Directory Enumeration
        if self.parsed_data['ad_enumeration']:
            md_content.append("## 🏢 Active Directory Enumeration")
            
            ad_data = self.parsed_data['ad_enumeration']
            
            # SMB Results
            if 'smb' in ad_data:
                smb_data = ad_data['smb']
                md_content.append("### SMB Enumeration")
                
                if smb_data['shares']:
                    md_content.append("#### Shares")
                    md_content.append("| Name | Description |")
                    md_content.append("|------|-------------|")
                    for share in smb_data['shares']:
                        md_content.append(f"| {share['name']} | {share['description']} |")
                    md_content.append("")
                
                if smb_data['users']:
                    md_content.append("#### Users")
                    for user in smb_data['users']:
                        md_content.append(f"- `{user}`")
                    md_content.append("")
            
            # LDAP Results
            if 'ldap' in ad_data:
                ldap_data = ad_data['ldap']
                md_content.append("### LDAP Enumeration")
                md_content.append(f"- **Base DN:** `{ldap_data['base_dn']}`")
                md_content.append("")
            
            # Kerberos Results
            if 'kerberos' in ad_data:
                kerberos_data = ad_data['kerberos']
                md_content.append("### Kerberos Enumeration")
                md_content.append(f"- **Realm:** `{kerberos_data['realm']}`")
                md_content.append("")
        
        # Summary
        if self.parsed_data['summary']:
            md_content.append("## 📋 Summary")
            for filename, content in self.parsed_data['summary'].items():
                md_content.append(f"### {filename}")
                md_content.append("```")
                md_content.append(content)
                md_content.append("```")
                md_content.append("")
        
        # Footer
        md_content.append("---")
        md_content.append(f"*Generated by NEXA-Obsidian Integration on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*")
        
        return '\n'.join(md_content)

def main():
    """Example usage"""
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python3 nexa_parser.py <nexa_output_directory>")
        sys.exit(1)
    
    output_dir = sys.argv[1]
    
    try:
        parser = NEXAParser(output_dir)
        parsed_data = parser.parse_all()
        
        # Print as JSON for debugging
        print(json.dumps(parsed_data, indent=2))
        
        # Print as Obsidian markdown
        print("\n" + "="*50)
        print("OBSIDIAN MARKDOWN FORMAT:")
        print("="*50)
        print(parser.to_obsidian_format())
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
