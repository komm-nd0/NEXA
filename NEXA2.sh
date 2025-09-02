#!/bin/bash

# Obscura Enumeration Tool
# Automated enumeration script for Windows and Linux targets
# Author: Obscura Security Team

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Global variables
TARGET_IP=""
TARGET_DOMAIN=""
OUTPUT_DIR=""
SCAN_RESULTS=""

# Function to print banner
print_banner() {
    clear
    echo -e "${RED}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║     NEXA - Network Enumeration & eXposure Analyzer           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to check dependencies
check_dependencies() {
    echo -e "${YELLOW}[*] Checking dependencies...${NC}"
    
    local missing_deps=()
    
    # Check for nmap
    if ! command -v nmap &> /dev/null; then
        missing_deps+=("nmap")
    fi
    
    # Check for gobuster
    if ! command -v gobuster &> /dev/null; then
        missing_deps+=("gobuster")
    fi
    
    # Check for nuclei
    if ! command -v nuclei &> /dev/null; then
        missing_deps+=("nuclei")
    fi
    
    # Check for enum4linux-ng
    if ! command -v enum4linux-ng &> /dev/null; then
        missing_deps+=("enum4linux-ng")
    fi
    
    # Check for ldapsearch
    if ! command -v ldapsearch &> /dev/null; then
        missing_deps+=("ldap-utils")
    fi
    
    # Check for httpx
    if ! command -v httpx &> /dev/null; then
        missing_deps+=("httpx")
    fi
    
    # Check for Sublist3r
    if ! command -v sublist3r &> /dev/null; then
        missing_deps+=("sublist3r")
    fi
    
    # Check for NetExec (nxc)
    if ! command -v nxc &> /dev/null; then
        missing_deps+=("nxc")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}[!] Missing dependencies: ${missing_deps[*]}${NC}"
        echo -e "${YELLOW}[*] Install missing dependencies:${NC}"
        for dep in "${missing_deps[@]}"; do
            case $dep in
                "nmap")
                    echo "  - nmap: sudo apt install nmap (Ubuntu/Debian) or brew install nmap (macOS)"
                    ;;
                "gobuster")
                    echo "  - gobuster: go install github.com/OJ/gobuster/v3/gobuster@latest"
                    ;;
                "nuclei")
                    echo "  - nuclei: go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest"
                    ;;
                "enum4linux-ng")
                    echo "  - enum4linux-ng: pip3 install enum4linux-ng"
                    ;;
                "ldap-utils")
                    echo "  - ldap-utils: sudo apt install ldap-utils (Ubuntu/Debian)"
                    ;;
                "httpx")
                    echo "  - httpx: sudo apt install httpx-toolkit (Kali) or go install github.com/projectdiscovery/httpx/cmd/httpx@latest"
                    ;;
                "sublist3r")
                    echo "  - Sublist3r: sudo apt install sublist3r (Kali) or pip3 install sublist3r"
                    ;;
                "nxc")
                    echo "  - nxc (NetExec): sudo apt install netexec (Kali) or pipx install netexec"
                    ;;
            esac
        done
        exit 1
    else
        echo -e "${GREEN}[+] All dependencies are installed${NC}"
    fi
}

# Function to get target information
get_target_info() {
    echo -e "${BLUE}[*] Target Information${NC}"
    
    # Ask for target type first
    echo -e "${YELLOW}Enter target (IP address or domain):${NC}"
    read -p "> " TARGET_INPUT
    
    # Determine if input is IP or domain
    if [[ $TARGET_INPUT =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        TARGET_IP="$TARGET_INPUT"
        TARGET_DOMAIN=""
        echo -e "${GREEN}[+] Target identified as IP address: $TARGET_IP${NC}"
    else
        TARGET_DOMAIN="$TARGET_INPUT"
        TARGET_IP=""
        echo -e "${GREEN}[+] Target identified as domain: $TARGET_DOMAIN${NC}"
        
        # Optionally resolve domain to IP for additional scanning
        echo -e "${YELLOW}Do you want to resolve domain to IP for additional scanning? (y/n):${NC}"
        read -p "> " resolve_choice
        if [[ $resolve_choice =~ ^[Yy]$ ]]; then
            TARGET_IP=$(dig +short "$TARGET_DOMAIN" | head -1)
            if [ -n "$TARGET_IP" ]; then
                echo -e "${GREEN}[+] Resolved IP: $TARGET_IP${NC}"
            else
                echo -e "${YELLOW}[!] Could not resolve domain to IP${NC}"
            fi
        fi
    fi
    
    # Create output directory
    OUTPUT_DIR="enum_results_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$OUTPUT_DIR"
    echo -e "${GREEN}[+] Output directory created: $OUTPUT_DIR${NC}"
}

# Function to run basic nmap scan
run_basic_nmap() {
    echo -e "${BLUE}[*] Running basic nmap scan...${NC}"
    local output_file="$OUTPUT_DIR/nmap_basic_scan.txt"
    
    if [ -n "$TARGET_IP" ]; then
        nmap -sS -sV -O -p- --min-rate=1000 -oN "$output_file" "$TARGET_IP"
    else
        nmap -sS -sV -O -p- --min-rate=1000 -oN "$output_file" "$TARGET_DOMAIN"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[+] Basic nmap scan completed: $output_file${NC}"
        SCAN_RESULTS="$output_file"
    else
        echo -e "${RED}[!] Basic nmap scan failed${NC}"
    fi
}

# Function to run aggressive nmap scan
run_aggressive_nmap() {
    echo -e "${BLUE}[*] Running aggressive nmap scan...${NC}"
    local output_file="$OUTPUT_DIR/nmap_aggressive_scan.txt"
    
    if [ -n "$TARGET_IP" ]; then
        nmap -sS -sV -O -A -p- --min-rate=1000 --script=vuln -oN "$output_file" "$TARGET_IP"
    else
        nmap -sS -sV -O -A -p- --min-rate=1000 --script=vuln -oN "$output_file" "$TARGET_DOMAIN"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[+] Aggressive nmap scan completed: $output_file${NC}"
        SCAN_RESULTS="$output_file"
    fi
}
# Function to run stealth nmap scan
run_stealth_nmap() {
    echo -e "${BLUE}[*] Running stealth nmap scan...${NC}"
    local output_file="$OUTPUT_DIR/nmap_stealth_scan.txt"
    
    if [ -n "$TARGET_IP" ]; then
        nmap -sS -sV -O -p- --min-rate=100 --max-retries=2 -oN "$output_file" "$TARGET_IP"
    else
        nmap -sS -sV -O -p- --min-rate=100 --max-retries=2 -oN "$output_file" "$TARGET_DOMAIN"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[+] Stealth nmap scan completed: $output_file${NC}"
        SCAN_RESULTS="$output_file"
    else
        echo -e "${RED}[!] Stealth nmap scan failed${NC}"
    fi
}

# Function to run web application enumeration
run_web_enumeration() {
    echo -e "${BLUE}[*] Starting web application enumeration...${NC}"
    
    # Check if target has web services
    if ! grep -q "80/tcp\|443/tcp\|8080/tcp\|8443/tcp" "$SCAN_RESULTS" 2>/dev/null; then
        echo -e "${YELLOW}[!] No web services detected. Running basic port scan first...${NC}"
        run_basic_nmap
    fi
    
    local web_output_dir="$OUTPUT_DIR/web_enumeration"
    mkdir -p "$web_output_dir"
    
    # If domain provided, run subdomain enumeration first
    if [ -n "$TARGET_DOMAIN" ]; then
        echo -e "${CYAN}[*] Running subdomain enumeration (Sublist3r + httpx)...${NC}"
        local subs_file="$web_output_dir/subdomains.txt"
        local live_subs_file="$web_output_dir/live_subdomains.txt"
        sublist3r -d "$TARGET_DOMAIN" -o "$subs_file" >/dev/null 2>&1
        if [ -s "$subs_file" ]; then
            cat "$subs_file" | httpx -silent -status-code -title -ip -o "$live_subs_file" 2>/dev/null
        fi
    fi
    
    # Directory enumeration with gobuster
    echo -e "${CYAN}[*] Running directory enumeration...${NC}"
    local dir_output="$web_output_dir/gobuster_dirs.txt"
    
    if [ -n "$TARGET_DOMAIN" ]; then
        gobuster dir -u "http://$TARGET_DOMAIN" -w /usr/share/wordlists/dirb/common.txt -o "$dir_output" 2>/dev/null
    else
        gobuster dir -u "http://$TARGET_IP" -w /usr/share/wordlists/dirb/common.txt -o "$dir_output" 2>/dev/null
    fi
    
    # Nuclei vulnerability scan
    echo -e "${CYAN}[*] Running Nuclei vulnerability scan...${NC}"
    local nuclei_output="$web_output_dir/nuclei_scan.txt"
    
    if [ -n "$TARGET_DOMAIN" ]; then
        nuclei -u "http://$TARGET_DOMAIN" -o "$nuclei_output" -silent 2>/dev/null
    else
        nuclei -u "http://$TARGET_IP" -o "$nuclei_output" -silent 2>/dev/null
    fi
    
    # Additional web enumeration
    echo -e "${CYAN}[*] Running additional web enumeration...${NC}"
    local additional_output="$web_output_dir/additional_enum.txt"
    
    {
        echo "=== Web Enumeration Results ==="
        echo "Target: $TARGET_IP"
        echo "Domain: $TARGET_DOMAIN"
        echo "Timestamp: $(date)"
        echo ""
        if [ -n "$TARGET_DOMAIN" ]; then
            echo "=== Subdomain Enumeration ==="
            if [ -f "$web_output_dir/subdomains.txt" ]; then
                echo "Subdomains found:"
                wc -l < "$web_output_dir/subdomains.txt" 2>/dev/null || true
            fi
            if [ -f "$web_output_dir/live_subdomains.txt" ]; then
                echo "Live subdomains (via httpx):"
                cat "$web_output_dir/live_subdomains.txt"
            fi
            echo ""
        fi
        echo "=== Directory Enumeration ==="
        if [ -f "$dir_output" ]; then
            cat "$dir_output"
        fi
        echo ""
        echo "=== Vulnerability Scan ==="
        if [ -f "$nuclei_output" ]; then
            cat "$nuclei_output"
        fi
    } > "$additional_output"
    
    echo -e "${GREEN}[+] Web enumeration completed. Results saved in: $web_output_dir${NC}"
}

# Function to run SMB enumeration
run_smb_enumeration() {
    echo -e "${BLUE}[*] Running SMB enumeration...${NC}"
    
    local ad_output_dir="$OUTPUT_DIR/ad_enumeration"
    mkdir -p "$ad_output_dir"
    
    local smb_output="$ad_output_dir/enum4linux-ng_smb.txt"
    
    if [ -n "$TARGET_IP" ]; then
        enum4linux-ng -A "$TARGET_IP" > "$smb_output" 2>&1
    else
        enum4linux-ng -A "$TARGET_DOMAIN" > "$smb_output" 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[+] SMB enumeration completed: $smb_output${NC}"
    else
        echo -e "${RED}[!] SMB enumeration failed${NC}"
    fi
}

# Function to run LDAP enumeration
run_ldap_enumeration() {
    echo -e "${BLUE}[*] Running LDAP enumeration...${NC}"
    
    local ad_output_dir="$OUTPUT_DIR/ad_enumeration"
    mkdir -p "$ad_output_dir"
    
    local ldap_output="$ad_output_dir/ldap_enum.txt"
    
    # Try common LDAP ports
    for port in 389 636 3268 3269; do
        if [ -n "$TARGET_IP" ]; then
            if grep -q "${port}/tcp.*open" "$SCAN_RESULTS" 2>/dev/null; then
                echo "=== LDAP Enumeration on port $port ===" > "$ldap_output"
                ldapsearch -H "ldap://$TARGET_IP:$port" -x -s base -b "" >> "$ldap_output" 2>&1
                break
            fi
        else
            # For domain targets, try direct LDAP connection
            echo "=== LDAP Enumeration on port $port ===" > "$ldap_output"
            ldapsearch -H "ldap://$TARGET_DOMAIN:$port" -x -s base -b "" >> "$ldap_output" 2>&1
            break
        fi
    done
    
    echo -e "${GREEN}[+] LDAP enumeration completed: $ldap_output${NC}"
}

# Function to run Kerberos enumeration
run_kerberos_enumeration() {
    echo -e "${BLUE}[*] Running Kerberos enumeration...${NC}"
    
    local ad_output_dir="$OUTPUT_DIR/ad_enumeration"
    mkdir -p "$ad_output_dir"
    
    local kerberos_output="$ad_output_dir/kerberos_enum.txt"
    
    # Check for Kerberos ports
    for port in 88 464; do
        if [ -n "$TARGET_IP" ]; then
            if grep -q "${port}/tcp.*open" "$SCAN_RESULTS" 2>/dev/null; then
                echo "=== Kerberos Enumeration on port $port ===" > "$kerberos_output"
                nmap -p $port --script=krb5-enum-users "$TARGET_IP" >> "$kerberos_output" 2>&1
                break
            fi
        else
            # For domain targets, try direct Kerberos connection
            echo "=== Kerberos Enumeration on port $port ===" > "$kerberos_output"
            nmap -p $port --script=krb5-enum-users "$TARGET_DOMAIN" >> "$kerberos_output" 2>&1
            break
        fi
    done
    
    echo -e "${GREEN}[+] Kerberos enumeration completed: $kerberos_output${NC}"
}

# Function to run NetExec (nxc) enumeration for AD-related services
run_nxc_enumeration() {
    echo -e "${BLUE}[*] Running NetExec (nxc) enumeration...${NC}"
    local ad_output_dir="$OUTPUT_DIR/ad_enumeration"
    mkdir -p "$ad_output_dir"
    local nxc_output="$ad_output_dir/nxc_enum.txt"
    local target_value
    if [ -n "$TARGET_IP" ]; then
        target_value="$TARGET_IP"
    else
        target_value="$TARGET_DOMAIN"
    fi
    {
        echo "=== NetExec (nxc) Enumeration ==="
        echo "Target: $target_value"
        echo "Timestamp: $(date)"
        echo ""
        echo "-- nxc smb --"
        nxc smb "$target_value" --shares --pass-pol 2>&1 || true
        echo ""
        echo "-- nxc ldap --"
        nxc ldap "$target_value" --asreproast 2>&1 || true
        echo ""
        echo "-- nxc winrm --"
        nxc winrm "$target_value" -M spooler 2>&1 || true
    } > "$nxc_output"
    echo -e "${GREEN}[+] NetExec (nxc) enumeration completed: $nxc_output${NC}"
}

# Function to run full AD enumeration
run_full_ad_enumeration() {
    echo -e "${BLUE}[*] Starting full Active Directory enumeration...${NC}"
    
    # Run basic scan first if not already done
    if [ -z "$SCAN_RESULTS" ]; then
        run_basic_nmap
    fi
    
    # Run all AD enumeration types
    run_smb_enumeration
    run_ldap_enumeration
    run_kerberos_enumeration
    run_nxc_enumeration
    
    # Generate summary report
    local summary_file="$OUTPUT_DIR/ad_enumeration_summary.txt"
    
    {
        echo "=== Active Directory Enumeration Summary ==="
        echo "Target IP: $TARGET_IP"
        echo "Target Domain: $TARGET_DOMAIN"
        echo "Scan Date: $(date)"
        echo ""
        echo "=== SCAN RESULTS ==="
        echo "Nmap Results: $SCAN_RESULTS"
        echo "SMB Enumeration: $OUTPUT_DIR/ad_enumeration/enum4linux-ng_smb.txt"
        echo "LDAP Enumeration: $OUTPUT_DIR/ad_enumeration/ldap_enum.txt"
        echo "Kerberos Enumeration: $OUTPUT_DIR/ad_enumeration/kerberos_enum.txt"
        echo "NetExec Enumeration: $OUTPUT_DIR/ad_enumeration/nxc_enum.txt"
        echo ""
        echo "=== RECOMMENDATIONS ==="
        echo "1. Review SMB enumeration for user accounts and shares"
        echo "2. Check LDAP results for domain structure and users"
        echo "3. Analyze Kerberos enumeration for authentication methods"
        echo "4. Consider additional manual testing based on findings"
    } > "$summary_file"
    
    echo -e "${GREEN}[+] Full AD enumeration completed! Summary: $summary_file${NC}"
}

# Function to run Active Directory enumeration (legacy function for comprehensive mode)
run_ad_enumeration() {
    echo -e "${BLUE}[*] Starting Active Directory enumeration...${NC}"
    run_full_ad_enumeration
}

# Function to run comprehensive enumeration
run_comprehensive_enumeration() {
    echo -e "${BLUE}[*] Starting comprehensive enumeration...${NC}"
    
    # Run all enumeration types
    run_basic_nmap
    run_web_enumeration
    run_ad_enumeration
    
    # Generate summary report
    local summary_file="$OUTPUT_DIR/enumeration_summary.txt"
    
    {
        echo "=== OBSCURA ENUMERATION TOOL - SUMMARY REPORT ==="
        echo "Target IP: $TARGET_IP"
        echo "Target Domain: $TARGET_DOMAIN"
        echo "Scan Date: $(date)"
        echo "Output Directory: $OUTPUT_DIR"
        echo ""
        echo "=== SCAN RESULTS ==="
        echo "Nmap Results: $SCAN_RESULTS"
        echo "Web Enumeration: $OUTPUT_DIR/web_enumeration/"
        echo "AD Enumeration: $OUTPUT_DIR/ad_enumeration/"
        echo ""
        echo "=== RECOMMENDATIONS ==="
        echo "1. Review all scan results for potential vulnerabilities"
        echo "2. Perform manual verification of automated findings"
        echo "3. Document findings in your security assessment report"
        echo "4. Consider additional manual testing based on results"
    } > "$summary_file"
    
    echo -e "${GREEN}[+] Comprehensive enumeration completed!${NC}"
    echo -e "${GREEN}[+] Summary report: $summary_file${NC}"
}

# Function to display main menu
show_main_menu() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                        MAIN MENU                           ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}1.${NC} Windows Application Enumeration"
    echo -e "${YELLOW}2.${NC} Linux Application Enumeration"
    echo -e "${YELLOW}3.${NC} Active Directory Enumeration"
    echo -e "${YELLOW}4.${NC} Comprehensive Enumeration (All Types)"
    echo -e "${YELLOW}5.${NC} Exit"
    echo ""
}

# Function to display Windows menu
show_windows_menu() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                 WINDOWS APPLICATION MENU                    ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}1.${NC} Basic Nmap Scan"
    echo -e "${YELLOW}2.${NC} Aggressive Nmap Scan"
    echo -e "${YELLOW}3.${NC} Stealth Nmap Scan"
    echo -e "${YELLOW}4.${NC} Web Application Enumeration"
    echo -e "${YELLOW}5.${NC} Windows Service Enumeration"
    echo -e "${YELLOW}6.${NC} Back to Main Menu"
    echo ""
}

# Function to display Linux menu
show_linux_menu() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                  LINUX APPLICATION MENU                     ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}1.${NC} Basic Nmap Scan"
    echo -e "${YELLOW}2.${NC} Aggressive Nmap Scan"
    echo -e "${YELLOW}3.${NC} Stealth Nmap Scan"
    echo -e "${YELLOW}4.${NC} Web Application Enumeration"
    echo -e "${YELLOW}5.${NC} Linux Service Enumeration"
    echo -e "${YELLOW}6.${NC} Back to Main Menu"
    echo ""
}

# Function to handle Windows menu
handle_windows_menu() {
    while true; do
        show_windows_menu
        echo -e "${YELLOW}Select an option:${NC}"
        read -p "> " choice
        
        case $choice in
            1)
                run_basic_nmap
                ;;
            2)
                run_aggressive_nmap
                ;;
            3)
                run_stealth_nmap
                ;;
            4)
                run_web_enumeration
                ;;
            5)
                echo -e "${BLUE}[*] Running Windows service enumeration...${NC}"
                local service_output="$OUTPUT_DIR/windows_service_enum.txt"
                if [ -n "$TARGET_IP" ]; then
                    nmap -sV -sC -p- --script=banner,smb-enum-services "$TARGET_IP" -oN "$service_output"
                else
                    nmap -sV -sC -p- --script=banner,smb-enum-services "$TARGET_DOMAIN" -oN "$service_output"
                fi
                echo -e "${GREEN}[+] Windows service enumeration completed: $service_output${NC}"
                ;;
            6)
                return
                ;;
            *)
                echo -e "${RED}[!] Invalid option. Please try again.${NC}"
                ;;
        esac
        
        echo ""
        echo -e "${YELLOW}Press Enter to continue...${NC}"
        read
    done
}

# Function to handle Linux menu
handle_linux_menu() {
    while true; do
        show_linux_menu
        echo -e "${YELLOW}Select an option:${NC}"
        read -p "> " choice
        
        case $choice in
            1)
                run_basic_nmap
                ;;
            2)
                run_aggressive_nmap
                ;;
            3)
                run_stealth_nmap
                ;;
            4)
                run_web_enumeration
                ;;
            5)
                echo -e "${BLUE}[*] Running service enumeration...${NC}"
                local service_output="$OUTPUT_DIR/linux_service_enum.txt"
                if [ -n "$TARGET_IP" ]; then
                    nmap -sV -sC -p- --script=banner "$TARGET_IP" -oN "$service_output"
                else
                    nmap -sV -sC -p- --script=banner "$TARGET_DOMAIN" -oN "$service_output"
                fi
                echo -e "${GREEN}[+] Service enumeration completed: $service_output${NC}"
                ;;
            6)
                return
                ;;
            *)
                echo -e "${RED}[!] Invalid option. Please try again.${NC}"
                ;;
        esac
        
        echo ""
        echo -e "${YELLOW}Press Enter to continue...${NC}"
        read
    done
}

# Function to handle Active Directory menu
handle_ad_menu() {
    while true; do
        echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${CYAN}║                 ACTIVE DIRECTORY MENU                       ║${NC}"
        echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${YELLOW}1.${NC} Basic Nmap Scan"
        echo -e "${YELLOW}2.${NC} SMB Enumeration (enum4linux-ng)"
        echo -e "${YELLOW}3.${NC} LDAP Enumeration"
        echo -e "${YELLOW}4.${NC} Kerberos Enumeration"
        echo -e "${YELLOW}5.${NC} NXC Enumeration (NetExec)"
        echo -e "${YELLOW}6.${NC} Full AD Enumeration (All Above)"
        echo -e "${YELLOW}7.${NC} Back to Main Menu"
        echo ""
        
        echo -e "${YELLOW}Select an option:${NC}"
        read -p "> " choice
        
        case $choice in
            1)
                run_basic_nmap
                ;;
            2)
                run_smb_enumeration
                ;;
            3)
                run_ldap_enumeration
                ;;
            4)
                run_kerberos_enumeration
                ;;
            5)
                run_nxc_enumeration
                ;;
            6)
                run_full_ad_enumeration
                ;;
            7)
                return
                ;;
            *)
                echo -e "${RED}[!] Invalid option. Please try again.${NC}"
                ;;
        esac
        
        echo ""
        echo -e "${YELLOW}Press Enter to continue...${NC}"
        read
    done
}

# Function to show results
show_results() {
    if [ -n "$OUTPUT_DIR" ] && [ -d "$OUTPUT_DIR" ]; then
        echo -e "${GREEN}[+] Enumeration results saved in: $OUTPUT_DIR${NC}"
        echo -e "${CYAN}Available files:${NC}"
        ls -la "$OUTPUT_DIR"
    fi
}

# Main function
main() {
    print_banner
    
    # Check dependencies
    check_dependencies
    
    # Get target information
    get_target_info
    
    # Main menu loop
    while true; do
        show_main_menu
        echo -e "${YELLOW}Select an option:${NC}"
        read -p "> " choice
        
        case $choice in
            1)
                handle_windows_menu
                ;;
            2)
                handle_linux_menu
                ;;
            3)
                handle_ad_menu
                ;;
            4)
                run_comprehensive_enumeration
                ;;
            5)
                echo -e "${GREEN}[+] Thank you for using NEXA Enumeration Tool!${NC}"
                show_results
                exit 0
                ;;
            *)
                echo -e "${RED}[!] Invalid option. Please try again.${NC}"
                ;;
        esac
        
        echo ""
        echo -e "${YELLOW}Press Enter to continue...${NC}"
        read
    done
}

# Check if script is run with root privileges for certain operations
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}[*] Running with root privileges${NC}"
else
    echo -e "${YELLOW}[*] Some operations may require root privileges${NC}"
fi

# Run main function
main
