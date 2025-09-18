#!/usr/bin/env python3
"""
Example usage of NEXA-Obsidian Integration
Demonstrates how to use the integration scripts
"""

import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from nexa_parser import NEXAParser
from obsidian_integration import ObsidianIntegration

def example_parse_nexa_output():
    """Example: Parse NEXA output files"""
    print("=== Example: Parsing NEXA Output ===")
    
    # Example NEXA output directory (replace with actual path)
    nexa_output_dir = "enum_results_20231201_143022"
    
    if not os.path.exists(nexa_output_dir):
        print(f"Example NEXA output directory not found: {nexa_output_dir}")
        print("Please run NEXA first to generate output files")
        return
    
    try:
        # Create parser instance
        parser = NEXAParser(nexa_output_dir)
        
        # Parse all NEXA files
        parsed_data = parser.parse_all()
        
        # Print summary
        print(f"Parsed data for target: {nexa_output_dir}")
        print(f"Nmap scans found: {len(parsed_data['nmap_results'])}")
        print(f"Web enumeration data: {'Yes' if parsed_data['web_enumeration'] else 'No'}")
        print(f"AD enumeration data: {'Yes' if parsed_data['ad_enumeration'] else 'No'}")
        
        # Generate Obsidian markdown
        markdown_content = parser.to_obsidian_format()
        print(f"\nGenerated markdown length: {len(markdown_content)} characters")
        
        # Save to file for inspection
        output_file = "example_nexa_results.md"
        with open(output_file, 'w') as f:
            f.write(markdown_content)
        print(f"Saved example output to: {output_file}")
        
    except Exception as e:
        print(f"Error parsing NEXA output: {e}")

def example_obsidian_integration():
    """Example: Full Obsidian integration"""
    print("\n=== Example: Obsidian Integration ===")
    
    # Example paths (replace with actual paths)
    obsidian_vault = "/path/to/your/obsidian/vault"
    nexa_output_dir = "enum_results_20231201_143022"
    target_name = "example-target"
    
    if not os.path.exists(obsidian_vault):
        print(f"Example Obsidian vault not found: {obsidian_vault}")
        print("Please update the path to your actual Obsidian vault")
        return
    
    if not os.path.exists(nexa_output_dir):
        print(f"Example NEXA output directory not found: {nexa_output_dir}")
        print("Please run NEXA first to generate output files")
        return
    
    try:
        # Create integration instance
        integration = ObsidianIntegration(obsidian_vault)
        
        # Create pentest template
        template_path = integration.create_pentest_template()
        print(f"Created pentest template: {template_path}")
        
        # Create new pentest note
        note_path = integration.create_pentest_note_from_template(
            target_name=target_name,
            target=target_name,
            tester="Example Tester",
            scope="Example scope",
            methodology="OWASP"
        )
        print(f"Created pentest note: {note_path}")
        
        # Create NEXA results note
        nexa_note_path = integration.create_nexa_results_note(
            nexa_output_dir, target_name
        )
        print(f"Created NEXA results note: {nexa_note_path}")
        
        # Update pentest note with NEXA data
        integration.update_pentest_note(
            note_path, nexa_output_dir, target_name
        )
        print(f"Updated pentest note with NEXA data")
        
        # Copy NEXA files to vault
        files_path = integration.copy_nexa_files_to_vault(
            nexa_output_dir, target_name
        )
        print(f"Copied NEXA files to: {files_path}")
        
    except Exception as e:
        print(f"Error in Obsidian integration: {e}")

def example_cli_usage():
    """Example: CLI usage commands"""
    print("\n=== Example: CLI Usage Commands ===")
    
    commands = [
        {
            "description": "Create new pentest note with NEXA data",
            "command": """python3 obsidian_integration.py \\
  --vault /path/to/obsidian/vault \\
  --nexa-output /path/to/nexa/output \\
  --target "company-website" \\
  --action create-note \\
  --tester "John Doe" \\
  --scope "Full scope penetration test" \\
  --methodology "OWASP" """
        },
        {
            "description": "Update existing pentest note",
            "command": """python3 obsidian_integration.py \\
  --vault /path/to/obsidian/vault \\
  --nexa-output /path/to/nexa/output \\
  --target "company-website" \\
  --action update-note \\
  --note-path "Pentest_Notes/Company_Website.md" """
        },
        {
            "description": "Create NEXA results note only",
            "command": """python3 obsidian_integration.py \\
  --vault /path/to/obsidian/vault \\
  --nexa-output /path/to/nexa/output \\
  --target "company-website" \\
  --action results-only """
        },
        {
            "description": "Copy NEXA files to vault",
            "command": """python3 obsidian_integration.py \\
  --vault /path/to/obsidian/vault \\
  --nexa-output /path/to/nexa/output \\
  --target "company-website" \\
  --action copy-files """
        }
    ]
    
    for i, cmd in enumerate(commands, 1):
        print(f"\n{i}. {cmd['description']}:")
        print(cmd['command'])

def example_obsidian_plugin_usage():
    """Example: Obsidian plugin usage"""
    print("\n=== Example: Obsidian Plugin Usage ===")
    
    steps = [
        "1. Install the NEXA Integration plugin in Obsidian",
        "2. Click the NEXA icon in the ribbon or use Command Palette",
        "3. Fill in the NEXA output directory path",
        "4. Enter the target name",
        "5. Select the desired action (create-note, update-note, results-only)",
        "6. Click 'Import' to process the NEXA results",
        "7. Check your Pentest_Notes folder for the generated notes"
    ]
    
    for step in steps:
        print(step)

def main():
    """Run all examples"""
    print("NEXA-Obsidian Integration Examples")
    print("=" * 50)
    
    # Run examples
    example_parse_nexa_output()
    example_obsidian_integration()
    example_cli_usage()
    example_obsidian_plugin_usage()
    
    print("\n" + "=" * 50)
    print("Examples completed!")
    print("\nTo use with real data:")
    print("1. Run NEXA to generate reconnaissance results")
    print("2. Update the paths in this script to match your setup")
    print("3. Run the integration scripts with your actual data")

if __name__ == "__main__":
    main()
