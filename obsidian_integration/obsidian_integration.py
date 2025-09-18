#!/usr/bin/env python3
"""
NEXA-Obsidian Integration Script
Automatically integrates NEXA reconnaissance results into Obsidian vault
"""

import os
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
from nexa_parser import NEXAParser

class ObsidianIntegration:
    def __init__(self, obsidian_vault_path: str, pentest_notes_dir: str = "Pentest_Notes"):
        self.vault_path = Path(obsidian_vault_path)
        self.pentest_notes_dir = self.vault_path / pentest_notes_dir
        self.templates_dir = self.vault_path / "Templates"
        
        # Create directories if they don't exist
        self.pentest_notes_dir.mkdir(exist_ok=True)
        self.templates_dir.mkdir(exist_ok=True)
    
    def create_pentest_template(self) -> str:
        """Create a comprehensive pentest note template"""
        template_content = """# {{title}} - Penetration Test

## 📋 Test Information
- **Target:** `{{target}}`
- **Test Date:** {{date}}
- **Tester:** {{tester}}
- **Scope:** {{scope}}
- **Methodology:** {{methodology}}

## 🎯 Reconnaissance Results
<!-- NEXA integration will populate this section -->

### Network Discovery
- **Status:** Pending
- **Open Ports:** TBD
- **Services:** TBD
- **OS Detection:** TBD

### Web Application Enumeration
- **Subdomains:** TBD
- **Directories:** TBD
- **Vulnerabilities:** TBD

### Active Directory Enumeration
- **SMB Shares:** TBD
- **Users:** TBD
- **LDAP:** TBD
- **Kerberos:** TBD

## 🔍 Vulnerability Assessment
<!-- Manual testing results go here -->

### Critical Findings
- [ ] Finding 1
- [ ] Finding 2

### High Findings
- [ ] Finding 1
- [ ] Finding 2

### Medium Findings
- [ ] Finding 1
- [ ] Finding 2

### Low Findings
- [ ] Finding 1
- [ ] Finding 2

## 🎯 Exploitation
<!-- Exploitation attempts and results -->

### Successful Exploits
- [ ] Exploit 1
- [ ] Exploit 2

### Failed Exploits
- [ ] Exploit 1 (Reason: ...)
- [ ] Exploit 2 (Reason: ...)

## 📊 Post-Exploitation
<!-- Post-exploitation activities -->

### Privilege Escalation
- [ ] Local privilege escalation
- [ ] Domain privilege escalation

### Persistence
- [ ] Backdoor installation
- [ ] Scheduled tasks
- [ ] Service installation

### Data Exfiltration
- [ ] Sensitive data identified
- [ ] Data exfiltration attempted

## 📝 Reporting
<!-- Report generation and findings -->

### Executive Summary
<!-- High-level summary for management -->

### Technical Details
<!-- Detailed technical findings -->

### Recommendations
<!-- Remediation recommendations -->

## 🔗 References
- [NEXA Results]({{nexa_results_link}})
- [Tools Used](#tools-used)
- [Methodology](#methodology)

## 🛠️ Tools Used
- NEXA (Network Enumeration & xXposure Analyzer)
- Nmap
- Gobuster
- Nuclei
- enum4linux-ng
- NetExec (nxc)

---
*Template created: {{creation_date}}*
*Last updated: {{last_updated}}*
"""
        
        template_path = self.templates_dir / "Pentest_Template.md"
        template_path.write_text(template_content)
        
        return str(template_path)
    
    def create_nexa_results_note(self, nexa_output_dir: str, target_name: str) -> str:
        """Create a dedicated note for NEXA results"""
        parser = NEXAParser(nexa_output_dir)
        parsed_data = parser.parse_all()
        
        # Generate markdown content
        md_content = parser.to_obsidian_format()
        
        # Create note filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        note_filename = f"NEXA_Results_{target_name}_{timestamp}.md"
        note_path = self.pentest_notes_dir / note_filename
        
        # Write the note
        note_path.write_text(md_content)
        
        return str(note_path)
    
    def update_pentest_note(self, note_path: str, nexa_output_dir: str, 
                          target_name: str, section_to_update: str = "reconnaissance") -> bool:
        """Update an existing pentest note with NEXA results"""
        note_file = Path(note_path)
        
        if not note_file.exists():
            print(f"Note file not found: {note_path}")
            return False
        
        # Parse NEXA results
        parser = NEXAParser(nexa_output_dir)
        parsed_data = parser.parse_all()
        
        # Read existing note
        note_content = note_file.read_text()
        
        # Generate NEXA results markdown
        nexa_md = parser.to_obsidian_format()
        
        # Create a link to the detailed NEXA results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nexa_note_filename = f"NEXA_Results_{target_name}_{timestamp}.md"
        nexa_note_path = self.pentest_notes_dir / nexa_note_filename
        
        # Save detailed NEXA results
        nexa_note_path.write_text(nexa_md)
        
        # Create relative link
        relative_link = f"[[{nexa_note_filename}]]"
        
        # Update the note content based on section
        if section_to_update == "reconnaissance":
            # Replace the reconnaissance section
            updated_content = self._update_reconnaissance_section(
                note_content, parsed_data, relative_link
            )
        else:
            # Add NEXA results as a new section
            updated_content = note_content + f"\n\n## NEXA Reconnaissance Results\n{relative_link}\n"
        
        # Write updated content
        note_file.write_text(updated_content)
        
        return True
    
    def _update_reconnaissance_section(self, note_content: str, parsed_data: Dict[str, Any], 
                                     nexa_link: str) -> str:
        """Update the reconnaissance section with NEXA data"""
        lines = note_content.split('\n')
        updated_lines = []
        in_recon_section = False
        section_updated = False
        
        for line in lines:
            if line.startswith('## 🎯 Reconnaissance Results'):
                in_recon_section = True
                updated_lines.append(line)
                updated_lines.append("")
                updated_lines.append(f"**Detailed Results:** {nexa_link}")
                updated_lines.append("")
                
                # Add summary data
                if 'nmap_results' in parsed_data:
                    for scan_type, results in parsed_data['nmap_results'].items():
                        updated_lines.append(f"### {scan_type.title()} Nmap Scan")
                        updated_lines.append(f"- **Host Status:** {results['host_status']}")
                        updated_lines.append(f"- **Operating System:** {results['os_info']}")
                        updated_lines.append(f"- **Open Ports:** {results['total_ports']}")
                        updated_lines.append("")
                
                if 'web_enumeration' in parsed_data and parsed_data['web_enumeration']:
                    web_data = parsed_data['web_enumeration']
                    updated_lines.append("### Web Application Summary")
                    
                    if 'subdomains' in web_data:
                        updated_lines.append(f"- **Subdomains Found:** {len(web_data['subdomains'])}")
                    
                    if 'directories' in web_data:
                        updated_lines.append(f"- **Directories Found:** {len(web_data['directories'])}")
                    
                    if 'vulnerabilities' in web_data:
                        updated_lines.append(f"- **Vulnerabilities Found:** {len(web_data['vulnerabilities'])}")
                    
                    updated_lines.append("")
                
                if 'ad_enumeration' in parsed_data and parsed_data['ad_enumeration']:
                    ad_data = parsed_data['ad_enumeration']
                    updated_lines.append("### Active Directory Summary")
                    
                    if 'smb' in ad_data:
                        smb_data = ad_data['smb']
                        if 'shares' in smb_data:
                            updated_lines.append(f"- **SMB Shares:** {len(smb_data['shares'])}")
                        if 'users' in smb_data:
                            updated_lines.append(f"- **Users Found:** {len(smb_data['users'])}")
                    
                    updated_lines.append("")
                
                section_updated = True
                continue
            
            elif in_recon_section and line.startswith('## '):
                # End of reconnaissance section
                in_recon_section = False
                updated_lines.append(line)
            elif not in_recon_section:
                updated_lines.append(line)
        
        # If reconnaissance section wasn't found, add it
        if not section_updated:
            updated_lines.append("\n## 🎯 Reconnaissance Results")
            updated_lines.append("")
            updated_lines.append(f"**Detailed Results:** {nexa_link}")
            updated_lines.append("")
        
        return '\n'.join(updated_lines)
    
    def create_pentest_note_from_template(self, target_name: str, target: str, 
                                        tester: str, scope: str, methodology: str) -> str:
        """Create a new pentest note from template"""
        template_path = self.templates_dir / "Pentest_Template.md"
        
        if not template_path.exists():
            self.create_pentest_template()
        
        # Read template
        template_content = template_path.read_text()
        
        # Replace template variables
        now = datetime.now()
        template_content = template_content.replace('{{title}}', target_name)
        template_content = template_content.replace('{{target}}', target)
        template_content = template_content.replace('{{date}}', now.strftime('%Y-%m-%d'))
        template_content = template_content.replace('{{tester}}', tester)
        template_content = template_content.replace('{{scope}}', scope)
        template_content = template_content.replace('{{methodology}}', methodology)
        template_content = template_content.replace('{{creation_date}}', now.strftime('%Y-%m-%d %H:%M:%S'))
        template_content = template_content.replace('{{last_updated}}', now.strftime('%Y-%m-%d %H:%M:%S'))
        
        # Create note filename
        timestamp = now.strftime("%Y%m%d_%H%M%S")
        note_filename = f"Pentest_{target_name}_{timestamp}.md"
        note_path = self.pentest_notes_dir / note_filename
        
        # Write the note
        note_path.write_text(template_content)
        
        return str(note_path)
    
    def copy_nexa_files_to_vault(self, nexa_output_dir: str, target_name: str) -> str:
        """Copy NEXA output files to Obsidian vault for reference"""
        nexa_dir = Path(nexa_output_dir)
        if not nexa_dir.exists():
            raise FileNotFoundError(f"NEXA output directory not found: {nexa_output_dir}")
        
        # Create attachments directory
        attachments_dir = self.vault_path / "Attachments" / "NEXA_Results"
        attachments_dir.mkdir(parents=True, exist_ok=True)
        
        # Create target-specific directory
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        target_dir = attachments_dir / f"{target_name}_{timestamp}"
        target_dir.mkdir(exist_ok=True)
        
        # Copy all NEXA files
        for item in nexa_dir.rglob('*'):
            if item.is_file():
                relative_path = item.relative_to(nexa_dir)
                dest_path = target_dir / relative_path
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(item, dest_path)
        
        return str(target_dir)

def main():
    """Example usage and CLI interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description='NEXA-Obsidian Integration Tool')
    parser.add_argument('--vault', required=True, help='Path to Obsidian vault')
    parser.add_argument('--nexa-output', required=True, help='Path to NEXA output directory')
    parser.add_argument('--target', required=True, help='Target name/identifier')
    parser.add_argument('--action', choices=['create-note', 'update-note', 'copy-files'], 
                       default='create-note', help='Action to perform')
    parser.add_argument('--note-path', help='Path to existing note (for update-note action)')
    parser.add_argument('--tester', default='Unknown', help='Tester name')
    parser.add_argument('--scope', default='Full scope', help='Test scope')
    parser.add_argument('--methodology', default='OWASP', help='Testing methodology')
    
    args = parser.parse_args()
    
    try:
        integration = ObsidianIntegration(args.vault)
        
        if args.action == 'create-note':
            # Create new pentest note from template
            note_path = integration.create_pentest_note_from_template(
                args.target, args.target, args.tester, args.scope, args.methodology
            )
            print(f"Created pentest note: {note_path}")
            
            # Create NEXA results note
            nexa_note_path = integration.create_nexa_results_note(
                args.nexa_output, args.target
            )
            print(f"Created NEXA results note: {nexa_note_path}")
            
            # Update the pentest note with NEXA data
            integration.update_pentest_note(note_path, args.nexa_output, args.target)
            print(f"Updated pentest note with NEXA data")
            
        elif args.action == 'update-note':
            if not args.note_path:
                print("Error: --note-path required for update-note action")
                return 1
            
            success = integration.update_pentest_note(
                args.note_path, args.nexa_output, args.target
            )
            if success:
                print(f"Updated note: {args.note_path}")
            else:
                print("Failed to update note")
                return 1
                
        elif args.action == 'copy-files':
            files_path = integration.copy_nexa_files_to_vault(
                args.nexa_output, args.target
            )
            print(f"Copied NEXA files to: {files_path}")
        
        return 0
        
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())
