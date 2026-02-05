import sys
import os
# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.sites.xbet import XBetAnalyzer
from src.sites.dafabet import DafabetAnalyzer
from src.sites.pinup import PinUpAnalyzer
from src.sites.beinsports import BeInSportsAnalyzer
from tabulate import tabulate

def main():
    analyzers = [
        XBetAnalyzer(),
        DafabetAnalyzer(),
        PinUpAnalyzer(),
        BeInSportsAnalyzer()
    ]

    print("\n=== Betting Data API Analyzer ===\n")
    print("Listing potential targets and endpoints based on reverse engineering research.\n")

    for analyzer in analyzers:
        print(f"--- {analyzer.name} ({analyzer.domain}) ---")
        analysis = analyzer.analyze()
        print(f"Status: {analysis['status']}")
        print(f"Note: {analysis['message']}")
        
        endpoints = analyzer.get_endpoints()
        if endpoints:
            print("\nPotential Endpoints:")
            table_data = []
            for ep in endpoints:
                table_data.append([ep['description'], ep['url'], ep['notes']])
            
            print(tabulate(table_data, headers=["Description", "URL Pattern", "Notes"], tablefmt="grid"))
        print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    main()
