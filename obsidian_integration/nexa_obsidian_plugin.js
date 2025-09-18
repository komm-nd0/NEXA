/**
 * NEXA-Obsidian Plugin
 * A community plugin for Obsidian that integrates NEXA reconnaissance results
 */

const { Plugin, TFile, TFolder, Notice, Modal, Setting } = require('obsidian');

class NEXAIntegrationPlugin extends Plugin {
    async onload() {
        console.log('Loading NEXA Integration plugin');

        // Add ribbon icon
        this.addRibbonIcon('search', 'NEXA Integration', () => {
            new NEXAModal(this.app, this).open();
        });

        // Add command palette commands
        this.addCommand({
            id: 'nexa-import-results',
            name: 'Import NEXA Results',
            callback: () => {
                new NEXAModal(this.app, this).open();
            }
        });

        this.addCommand({
            id: 'nexa-create-pentest-note',
            name: 'Create Pentest Note from Template',
            callback: () => {
                new PentestNoteModal(this.app, this).open();
            }
        });

        this.addCommand({
            id: 'nexa-update-reconnaissance',
            name: 'Update Reconnaissance Section',
            callback: () => {
                new UpdateReconModal(this.app, this).open();
            }
        });
    }

    onunload() {
        console.log('Unloading NEXA Integration plugin');
    }
}

class NEXAModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "NEXA Integration" });

        // NEXA Output Directory
        new Setting(contentEl)
            .setName("NEXA Output Directory")
            .setDesc("Path to the NEXA enumeration results directory")
            .addText(text => text
                .setPlaceholder("e.g., /path/to/enum_results_20231201_143022")
                .onChange(value => this.nexaOutputDir = value));

        // Target Name
        new Setting(contentEl)
            .setName("Target Name")
            .setDesc("Name or identifier for the target")
            .addText(text => text
                .setPlaceholder("e.g., company-website")
                .onChange(value => this.targetName = value));

        // Action Selection
        new Setting(contentEl)
            .setName("Action")
            .setDesc("What would you like to do?")
            .addDropdown(dropdown => dropdown
                .addOption("create", "Create New Pentest Note")
                .addOption("update", "Update Existing Note")
                .addOption("results-only", "Create NEXA Results Note Only")
                .onChange(value => this.action = value));

        // Existing Note Path (for update action)
        new Setting(contentEl)
            .setName("Existing Note Path")
            .setDesc("Path to existing note (for update action)")
            .addText(text => text
                .setPlaceholder("e.g., Pentest_Notes/Company_Website.md")
                .onChange(value => this.existingNotePath = value));

        // Buttons
        const buttonContainer = contentEl.createDiv();
        buttonContainer.style.marginTop = "20px";

        new Setting(buttonContainer)
            .addButton(button => button
                .setButtonText("Import")
                .setCta()
                .onClick(() => this.importNEXAResults()));

        new Setting(buttonContainer)
            .addButton(button => button
                .setButtonText("Cancel")
                .onClick(() => this.close()));
    }

    async importNEXAResults() {
        if (!this.nexaOutputDir || !this.targetName) {
            new Notice("Please fill in all required fields");
            return;
        }

        try {
            if (this.action === "create") {
                await this.createNewPentestNote();
            } else if (this.action === "update") {
                await this.updateExistingNote();
            } else if (this.action === "results-only") {
                await this.createNEXAResultsNote();
            }

            new Notice("NEXA results imported successfully!");
            this.close();
        } catch (error) {
            new Notice(`Error importing NEXA results: ${error.message}`);
            console.error(error);
        }
    }

    async createNewPentestNote() {
        // Create pentest note from template
        const templatePath = "Templates/Pentest_Template.md";
        const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
        
        if (!templateFile) {
            // Create template if it doesn't exist
            await this.createPentestTemplate();
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const noteName = `Pentest_${this.targetName}_${timestamp}.md`;
        const notePath = `Pentest_Notes/${noteName}`;

        // Read template and replace variables
        const templateContent = await this.app.vault.read(templateFile);
        const noteContent = templateContent
            .replace(/\{\{title\}\}/g, this.targetName)
            .replace(/\{\{target\}\}/g, this.targetName)
            .replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0])
            .replace(/\{\{tester\}\}/g, "Unknown")
            .replace(/\{\{scope\}\}/g, "Full scope")
            .replace(/\{\{methodology\}\}/g, "OWASP");

        // Create the note
        await this.app.vault.create(notePath, noteContent);

        // Create NEXA results note
        await this.createNEXAResultsNote();

        // Update the pentest note with NEXA data
        await this.updateNoteWithNEXAData(notePath);
    }

    async updateExistingNote() {
        if (!this.existingNotePath) {
            new Notice("Please specify the existing note path");
            return;
        }

        await this.updateNoteWithNEXAData(this.existingNotePath);
    }

    async createNEXAResultsNote() {
        // Parse NEXA results (simplified version)
        const nexaData = await this.parseNEXAOutput(this.nexaOutputDir);
        
        // Generate markdown content
        const markdownContent = this.generateNEXAMarkdown(nexaData);
        
        // Create note
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const noteName = `NEXA_Results_${this.targetName}_${timestamp}.md`;
        const notePath = `Pentest_Notes/${noteName}`;
        
        await this.app.vault.create(notePath, markdownContent);
    }

    async updateNoteWithNEXAData(notePath) {
        const noteFile = this.app.vault.getAbstractFileByPath(notePath);
        if (!noteFile) {
            throw new Error(`Note not found: ${notePath}`);
        }

        const noteContent = await this.app.vault.read(noteFile);
        const nexaData = await this.parseNEXAOutput(this.nexaOutputDir);
        
        // Update reconnaissance section
        const updatedContent = this.updateReconnaissanceSection(noteContent, nexaData);
        
        await this.app.vault.modify(noteFile, updatedContent);
    }

    async parseNEXAOutput(outputDir) {
        // This is a simplified parser - in a real implementation,
        // you might want to use a more robust parsing method
        const fs = require('fs');
        const path = require('path');
        
        const data = {
            target_info: {},
            nmap_results: {},
            web_enumeration: {},
            ad_enumeration: {}
        };

        try {
            // Parse nmap results
            const nmapFiles = ['nmap_basic_scan.txt', 'nmap_aggressive_scan.txt', 'nmap_stealth_scan.txt'];
            for (const file of nmapFiles) {
                const filePath = path.join(outputDir, file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    data.nmap_results[file.replace('.txt', '')] = this.parseNmapContent(content);
                }
            }

            // Parse web enumeration
            const webDir = path.join(outputDir, 'web_enumeration');
            if (fs.existsSync(webDir)) {
                data.web_enumeration = this.parseWebEnumeration(webDir);
            }

            // Parse AD enumeration
            const adDir = path.join(outputDir, 'ad_enumeration');
            if (fs.existsSync(adDir)) {
                data.ad_enumeration = this.parseADEnumeration(adDir);
            }

        } catch (error) {
            console.error('Error parsing NEXA output:', error);
        }

        return data;
    }

    parseNmapContent(content) {
        const openPorts = [];
        const portPattern = /(\d+)\/tcp\s+open\s+(\w+)(?:\s+(.+))?/g;
        let match;

        while ((match = portPattern.exec(content)) !== null) {
            openPorts.push({
                port: parseInt(match[1]),
                service: match[2],
                version: match[3] ? match[3].trim() : 'Unknown'
            });
        }

        const osMatch = content.match(/Running: (.+)/);
        const osInfo = osMatch ? osMatch[1] : 'Unknown';

        const hostStatus = content.includes('Host is up') ? 'Up' : 
                          content.includes('Host seems down') ? 'Down' : 'Unknown';

        return {
            host_status: hostStatus,
            os_info: osInfo,
            open_ports: openPorts,
            total_ports: openPorts.length
        };
    }

    parseWebEnumeration(webDir) {
        const fs = require('fs');
        const path = require('path');
        const data = {};

        // Parse directories
        const gobusterFile = path.join(webDir, 'gobuster_dirs.txt');
        if (fs.existsSync(gobusterFile)) {
            const content = fs.readFileSync(gobusterFile, 'utf8');
            data.directories = this.parseGobusterContent(content);
        }

        // Parse vulnerabilities
        const nucleiFile = path.join(webDir, 'nuclei_scan.txt');
        if (fs.existsSync(nucleiFile)) {
            const content = fs.readFileSync(nucleiFile, 'utf8');
            data.vulnerabilities = this.parseNucleiContent(content);
        }

        // Parse subdomains
        const subdomainsFile = path.join(webDir, 'subdomains.txt');
        if (fs.existsSync(subdomainsFile)) {
            const content = fs.readFileSync(subdomainsFile, 'utf8');
            data.subdomains = content.split('\n').filter(line => line.trim());
        }

        return data;
    }

    parseADEnumeration(adDir) {
        const fs = require('fs');
        const path = require('path');
        const data = {};

        // Parse SMB enumeration
        const smbFile = path.join(adDir, 'enum4linux-ng_smb.txt');
        if (fs.existsSync(smbFile)) {
            const content = fs.readFileSync(smbFile, 'utf8');
            data.smb = this.parseSMBContent(content);
        }

        return data;
    }

    parseGobusterContent(content) {
        const directories = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.trim() && !line.startsWith('=')) {
                const parts = line.split(/\s+/);
                if (parts.length >= 3) {
                    directories.push({
                        path: parts[0],
                        status: parts[1],
                        size: parts[2]
                    });
                }
            }
        }
        
        return directories;
    }

    parseNucleiContent(content) {
        const vulnerabilities = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.includes('[') && line.includes(']')) {
                const parts = line.split(']');
                if (parts.length >= 2) {
                    const severity = parts[0].replace('[', '').trim();
                    const rest = parts[1].trim();
                    const urlMatch = rest.match(/(https?:\/\/[^\s]+)/);
                    const url = urlMatch ? urlMatch[1] : 'Unknown';
                    const description = rest.replace(url, '').trim();
                    
                    vulnerabilities.push({
                        severity,
                        url,
                        description
                    });
                }
            }
        }
        
        return vulnerabilities;
    }

    parseSMBContent(content) {
        const shares = [];
        const users = [];
        
        const sharePattern = /Share\s+(\w+)\s+\((.+)\)/g;
        let match;
        
        while ((match = sharePattern.exec(content)) !== null) {
            shares.push({
                name: match[1],
                description: match[2]
            });
        }
        
        const userPattern = /User\s+(\w+)/g;
        while ((match = userPattern.exec(content)) !== null) {
            users.push(match[1]);
        }
        
        return {
            shares,
            users: [...new Set(users)] // Remove duplicates
        };
    }

    generateNEXAMarkdown(data) {
        let content = `# NEXA Reconnaissance Results\n\n`;
        content += `**Generated:** ${new Date().toISOString()}\n\n`;

        // Nmap Results
        if (Object.keys(data.nmap_results).length > 0) {
            content += `## 🔍 Network Reconnaissance\n\n`;
            
            for (const [scanType, results] of Object.entries(data.nmap_results)) {
                content += `### ${scanType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}\n`;
                content += `- **Host Status:** ${results.host_status}\n`;
                content += `- **Operating System:** ${results.os_info}\n`;
                content += `- **Open Ports:** ${results.total_ports}\n\n`;
                
                if (results.open_ports.length > 0) {
                    content += `| Port | Service | Version |\n`;
                    content += `|------|---------|----------|\n`;
                    for (const port of results.open_ports) {
                        content += `| ${port.port} | ${port.service} | ${port.version} |\n`;
                    }
                    content += `\n`;
                }
            }
        }

        // Web Enumeration
        if (data.web_enumeration && Object.keys(data.web_enumeration).length > 0) {
            content += `## 🌐 Web Application Enumeration\n\n`;
            
            if (data.web_enumeration.subdomains) {
                content += `### Subdomains\n`;
                for (const subdomain of data.web_enumeration.subdomains) {
                    content += `- \`${subdomain}\`\n`;
                }
                content += `\n`;
            }
            
            if (data.web_enumeration.directories) {
                content += `### Discovered Directories\n`;
                content += `| Path | Status | Size |\n`;
                content += `|------|--------|------|\n`;
                for (const dir of data.web_enumeration.directories) {
                    content += `| \`${dir.path}\` | ${dir.status} | ${dir.size} |\n`;
                }
                content += `\n`;
            }
            
            if (data.web_enumeration.vulnerabilities) {
                content += `### Vulnerabilities\n`;
                content += `| Severity | URL | Description |\n`;
                content += `|----------|-----|-------------|\n`;
                for (const vuln of data.web_enumeration.vulnerabilities) {
                    content += `| ${vuln.severity} | ${vuln.url} | ${vuln.description} |\n`;
                }
                content += `\n`;
            }
        }

        // AD Enumeration
        if (data.ad_enumeration && Object.keys(data.ad_enumeration).length > 0) {
            content += `## 🏢 Active Directory Enumeration\n\n`;
            
            if (data.ad_enumeration.smb) {
                content += `### SMB Enumeration\n`;
                
                if (data.ad_enumeration.smb.shares) {
                    content += `#### Shares\n`;
                    content += `| Name | Description |\n`;
                    content += `|------|-------------|\n`;
                    for (const share of data.ad_enumeration.smb.shares) {
                        content += `| ${share.name} | ${share.description} |\n`;
                    }
                    content += `\n`;
                }
                
                if (data.ad_enumeration.smb.users) {
                    content += `#### Users\n`;
                    for (const user of data.ad_enumeration.smb.users) {
                        content += `- \`${user}\`\n`;
                    }
                    content += `\n`;
                }
            }
        }

        content += `---\n`;
        content += `*Generated by NEXA-Obsidian Integration*\n`;
        
        return content;
    }

    updateReconnaissanceSection(noteContent, nexaData) {
        const lines = noteContent.split('\n');
        const updatedLines = [];
        let inReconSection = false;
        let sectionUpdated = false;

        for (const line of lines) {
            if (line.startsWith('## 🎯 Reconnaissance Results')) {
                inReconSection = true;
                updatedLines.push(line);
                updatedLines.push('');
                updatedLines.push('**Status:** Completed');
                updatedLines.push('');

                // Add summary data
                if (Object.keys(nexaData.nmap_results).length > 0) {
                    for (const [scanType, results] of Object.entries(nexaData.nmap_results)) {
                        updatedLines.push(`### ${scanType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Nmap Scan`);
                        updatedLines.push(`- **Host Status:** ${results.host_status}`);
                        updatedLines.push(`- **Operating System:** ${results.os_info}`);
                        updatedLines.push(`- **Open Ports:** ${results.total_ports}`);
                        updatedLines.push('');
                    }
                }

                if (nexaData.web_enumeration) {
                    updatedLines.push('### Web Application Summary');
                    
                    if (nexaData.web_enumeration.subdomains) {
                        updatedLines.push(`- **Subdomains Found:** ${nexaData.web_enumeration.subdomains.length}`);
                    }
                    
                    if (nexaData.web_enumeration.directories) {
                        updatedLines.push(`- **Directories Found:** ${nexaData.web_enumeration.directories.length}`);
                    }
                    
                    if (nexaData.web_enumeration.vulnerabilities) {
                        updatedLines.push(`- **Vulnerabilities Found:** ${nexaData.web_enumeration.vulnerabilities.length}`);
                    }
                    
                    updatedLines.push('');
                }

                if (nexaData.ad_enumeration) {
                    updatedLines.push('### Active Directory Summary');
                    
                    if (nexaData.ad_enumeration.smb) {
                        if (nexaData.ad_enumeration.smb.shares) {
                            updatedLines.push(`- **SMB Shares:** ${nexaData.ad_enumeration.smb.shares.length}`);
                        }
                        if (nexaData.ad_enumeration.smb.users) {
                            updatedLines.push(`- **Users Found:** ${nexaData.ad_enumeration.smb.users.length}`);
                        }
                    }
                    
                    updatedLines.push('');
                }

                sectionUpdated = true;
                continue;
            } else if (inReconSection && line.startsWith('## ')) {
                inReconSection = false;
                updatedLines.push(line);
            } else if (!inReconSection) {
                updatedLines.push(line);
            }
        }

        if (!sectionUpdated) {
            updatedLines.push('\n## 🎯 Reconnaissance Results');
            updatedLines.push('');
            updatedLines.push('**Status:** Completed');
            updatedLines.push('');
        }

        return updatedLines.join('\n');
    }

    async createPentestTemplate() {
        const templateContent = `# {{title}} - Penetration Test

## 📋 Test Information
- **Target:** \`{{target}}\`
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
`;

        const templatePath = "Templates/Pentest_Template.md";
        await this.app.vault.create(templatePath, templateContent);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class PentestNoteModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Create Pentest Note" });

        new Setting(contentEl)
            .setName("Target Name")
            .setDesc("Name or identifier for the target")
            .addText(text => text
                .setPlaceholder("e.g., company-website")
                .onChange(value => this.targetName = value));

        new Setting(contentEl)
            .setName("Target")
            .setDesc("Target IP or domain")
            .addText(text => text
                .setPlaceholder("e.g., 192.168.1.100 or example.com")
                .onChange(value => this.target = value));

        new Setting(contentEl)
            .setName("Tester")
            .setDesc("Name of the tester")
            .addText(text => text
                .setPlaceholder("e.g., John Doe")
                .onChange(value => this.tester = value));

        new Setting(contentEl)
            .setName("Scope")
            .setDesc("Test scope description")
            .addText(text => text
                .setPlaceholder("e.g., Full scope penetration test")
                .onChange(value => this.scope = value));

        new Setting(contentEl)
            .setName("Methodology")
            .setDesc("Testing methodology")
            .addText(text => text
                .setPlaceholder("e.g., OWASP, PTES, NIST")
                .onChange(value => this.methodology = value));

        const buttonContainer = contentEl.createDiv();
        buttonContainer.style.marginTop = "20px";

        new Setting(buttonContainer)
            .addButton(button => button
                .setButtonText("Create Note")
                .setCta()
                .onClick(() => this.createNote()));

        new Setting(buttonContainer)
            .addButton(button => button
                .setButtonText("Cancel")
                .onClick(() => this.close()));
    }

    async createNote() {
        if (!this.targetName || !this.target) {
            new Notice("Please fill in target name and target");
            return;
        }

        try {
            // Create template if it doesn't exist
            const templatePath = "Templates/Pentest_Template.md";
            let templateFile = this.app.vault.getAbstractFileByPath(templatePath);
            
            if (!templateFile) {
                await this.createPentestTemplate();
                templateFile = this.app.vault.getAbstractFileByPath(templatePath);
            }

            // Create note
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const noteName = `Pentest_${this.targetName}_${timestamp}.md`;
            const notePath = `Pentest_Notes/${noteName}`;

            const templateContent = await this.app.vault.read(templateFile);
            const noteContent = templateContent
                .replace(/\{\{title\}\}/g, this.targetName)
                .replace(/\{\{target\}\}/g, this.target)
                .replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0])
                .replace(/\{\{tester\}\}/g, this.tester || "Unknown")
                .replace(/\{\{scope\}\}/g, this.scope || "Full scope")
                .replace(/\{\{methodology\}\}/g, this.methodology || "OWASP")
                .replace(/\{\{creation_date\}\}/g, new Date().toISOString())
                .replace(/\{\{last_updated\}\}/g, new Date().toISOString());

            await this.app.vault.create(notePath, noteContent);
            new Notice(`Created pentest note: ${noteName}`);
            this.close();
        } catch (error) {
            new Notice(`Error creating note: ${error.message}`);
            console.error(error);
        }
    }

    async createPentestTemplate() {
        // Same template creation logic as in NEXAModal
        const templateContent = `# {{title}} - Penetration Test

## 📋 Test Information
- **Target:** \`{{target}}\`
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
`;

        const templatePath = "Templates/Pentest_Template.md";
        await this.app.vault.create(templatePath, templateContent);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class UpdateReconModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Update Reconnaissance Section" });

        new Setting(contentEl)
            .setName("Note Path")
            .setDesc("Path to the note to update")
            .addText(text => text
                .setPlaceholder("e.g., Pentest_Notes/Company_Website.md")
                .onChange(value => this.notePath = value));

        new Setting(contentEl)
            .setName("NEXA Output Directory")
            .setDesc("Path to the NEXA enumeration results directory")
            .addText(text => text
                .setPlaceholder("e.g., /path/to/enum_results_20231201_143022")
                .onChange(value => this.nexaOutputDir = value));

        const buttonContainer = contentEl.createDiv();
        buttonContainer.style.marginTop = "20px";

        new Setting(buttonContainer)
            .addButton(button => button
                .setButtonText("Update")
                .setCta()
                .onClick(() => this.updateReconnaissance()));

        new Setting(buttonContainer)
            .addButton(button => button
                .setButtonText("Cancel")
                .onClick(() => this.close()));
    }

    async updateReconnaissance() {
        if (!this.notePath || !this.nexaOutputDir) {
            new Notice("Please fill in all fields");
            return;
        }

        try {
            const noteFile = this.app.vault.getAbstractFileByPath(this.notePath);
            if (!noteFile) {
                new Notice("Note not found");
                return;
            }

            const noteContent = await this.app.vault.read(noteFile);
            const nexaData = await this.parseNEXAOutput(this.nexaOutputDir);
            
            const updatedContent = this.updateReconnaissanceSection(noteContent, nexaData);
            await this.app.vault.modify(noteFile, updatedContent);
            
            new Notice("Reconnaissance section updated successfully!");
            this.close();
        } catch (error) {
            new Notice(`Error updating reconnaissance: ${error.message}`);
            console.error(error);
        }
    }

    // Include the same parsing methods as NEXAModal
    async parseNEXAOutput(outputDir) {
        // Same implementation as in NEXAModal
        const fs = require('fs');
        const path = require('path');
        
        const data = {
            target_info: {},
            nmap_results: {},
            web_enumeration: {},
            ad_enumeration: {}
        };

        try {
            const nmapFiles = ['nmap_basic_scan.txt', 'nmap_aggressive_scan.txt', 'nmap_stealth_scan.txt'];
            for (const file of nmapFiles) {
                const filePath = path.join(outputDir, file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    data.nmap_results[file.replace('.txt', '')] = this.parseNmapContent(content);
                }
            }

            const webDir = path.join(outputDir, 'web_enumeration');
            if (fs.existsSync(webDir)) {
                data.web_enumeration = this.parseWebEnumeration(webDir);
            }

            const adDir = path.join(outputDir, 'ad_enumeration');
            if (fs.existsSync(adDir)) {
                data.ad_enumeration = this.parseADEnumeration(adDir);
            }

        } catch (error) {
            console.error('Error parsing NEXA output:', error);
        }

        return data;
    }

    parseNmapContent(content) {
        const openPorts = [];
        const portPattern = /(\d+)\/tcp\s+open\s+(\w+)(?:\s+(.+))?/g;
        let match;

        while ((match = portPattern.exec(content)) !== null) {
            openPorts.push({
                port: parseInt(match[1]),
                service: match[2],
                version: match[3] ? match[3].trim() : 'Unknown'
            });
        }

        const osMatch = content.match(/Running: (.+)/);
        const osInfo = osMatch ? osMatch[1] : 'Unknown';

        const hostStatus = content.includes('Host is up') ? 'Up' : 
                          content.includes('Host seems down') ? 'Down' : 'Unknown';

        return {
            host_status: hostStatus,
            os_info: osInfo,
            open_ports: openPorts,
            total_ports: openPorts.length
        };
    }

    parseWebEnumeration(webDir) {
        const fs = require('fs');
        const path = require('path');
        const data = {};

        const gobusterFile = path.join(webDir, 'gobuster_dirs.txt');
        if (fs.existsSync(gobusterFile)) {
            const content = fs.readFileSync(gobusterFile, 'utf8');
            data.directories = this.parseGobusterContent(content);
        }

        const nucleiFile = path.join(webDir, 'nuclei_scan.txt');
        if (fs.existsSync(nucleiFile)) {
            const content = fs.readFileSync(nucleiFile, 'utf8');
            data.vulnerabilities = this.parseNucleiContent(content);
        }

        const subdomainsFile = path.join(webDir, 'subdomains.txt');
        if (fs.existsSync(subdomainsFile)) {
            const content = fs.readFileSync(subdomainsFile, 'utf8');
            data.subdomains = content.split('\n').filter(line => line.trim());
        }

        return data;
    }

    parseADEnumeration(adDir) {
        const fs = require('fs');
        const path = require('path');
        const data = {};

        const smbFile = path.join(adDir, 'enum4linux-ng_smb.txt');
        if (fs.existsSync(smbFile)) {
            const content = fs.readFileSync(smbFile, 'utf8');
            data.smb = this.parseSMBContent(content);
        }

        return data;
    }

    parseGobusterContent(content) {
        const directories = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.trim() && !line.startsWith('=')) {
                const parts = line.split(/\s+/);
                if (parts.length >= 3) {
                    directories.push({
                        path: parts[0],
                        status: parts[1],
                        size: parts[2]
                    });
                }
            }
        }
        
        return directories;
    }

    parseNucleiContent(content) {
        const vulnerabilities = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.includes('[') && line.includes(']')) {
                const parts = line.split(']');
                if (parts.length >= 2) {
                    const severity = parts[0].replace('[', '').trim();
                    const rest = parts[1].trim();
                    const urlMatch = rest.match(/(https?:\/\/[^\s]+)/);
                    const url = urlMatch ? urlMatch[1] : 'Unknown';
                    const description = rest.replace(url, '').trim();
                    
                    vulnerabilities.push({
                        severity,
                        url,
                        description
                    });
                }
            }
        }
        
        return vulnerabilities;
    }

    parseSMBContent(content) {
        const shares = [];
        const users = [];
        
        const sharePattern = /Share\s+(\w+)\s+\((.+)\)/g;
        let match;
        
        while ((match = sharePattern.exec(content)) !== null) {
            shares.push({
                name: match[1],
                description: match[2]
            });
        }
        
        const userPattern = /User\s+(\w+)/g;
        while ((match = userPattern.exec(content)) !== null) {
            users.push(match[1]);
        }
        
        return {
            shares,
            users: [...new Set(users)]
        };
    }

    updateReconnaissanceSection(noteContent, nexaData) {
        const lines = noteContent.split('\n');
        const updatedLines = [];
        let inReconSection = false;
        let sectionUpdated = false;

        for (const line of lines) {
            if (line.startsWith('## 🎯 Reconnaissance Results')) {
                inReconSection = true;
                updatedLines.push(line);
                updatedLines.push('');
                updatedLines.push('**Status:** Completed');
                updatedLines.push('');

                if (Object.keys(nexaData.nmap_results).length > 0) {
                    for (const [scanType, results] of Object.entries(nexaData.nmap_results)) {
                        updatedLines.push(`### ${scanType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Nmap Scan`);
                        updatedLines.push(`- **Host Status:** ${results.host_status}`);
                        updatedLines.push(`- **Operating System:** ${results.os_info}`);
                        updatedLines.push(`- **Open Ports:** ${results.total_ports}`);
                        updatedLines.push('');
                    }
                }

                if (nexaData.web_enumeration) {
                    updatedLines.push('### Web Application Summary');
                    
                    if (nexaData.web_enumeration.subdomains) {
                        updatedLines.push(`- **Subdomains Found:** ${nexaData.web_enumeration.subdomains.length}`);
                    }
                    
                    if (nexaData.web_enumeration.directories) {
                        updatedLines.push(`- **Directories Found:** ${nexaData.web_enumeration.directories.length}`);
                    }
                    
                    if (nexaData.web_enumeration.vulnerabilities) {
                        updatedLines.push(`- **Vulnerabilities Found:** ${nexaData.web_enumeration.vulnerabilities.length}`);
                    }
                    
                    updatedLines.push('');
                }

                if (nexaData.ad_enumeration) {
                    updatedLines.push('### Active Directory Summary');
                    
                    if (nexaData.ad_enumeration.smb) {
                        if (nexaData.ad_enumeration.smb.shares) {
                            updatedLines.push(`- **SMB Shares:** ${nexaData.ad_enumeration.smb.shares.length}`);
                        }
                        if (nexaData.ad_enumeration.smb.users) {
                            updatedLines.push(`- **Users Found:** ${nexaData.ad_enumeration.smb.users.length}`);
                        }
                    }
                    
                    updatedLines.push('');
                }

                sectionUpdated = true;
                continue;
            } else if (inReconSection && line.startsWith('## ')) {
                inReconSection = false;
                updatedLines.push(line);
            } else if (!inReconSection) {
                updatedLines.push(line);
            }
        }

        if (!sectionUpdated) {
            updatedLines.push('\n## 🎯 Reconnaissance Results');
            updatedLines.push('');
            updatedLines.push('**Status:** Completed');
            updatedLines.push('');
        }

        return updatedLines.join('\n');
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

module.exports = NEXAIntegrationPlugin;
