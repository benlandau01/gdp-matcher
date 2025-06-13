import requests
import pandas as pd
import json
from pathlib import Path

def get_world_bank_gdp():
    """Fetch GDP data from World Bank API"""
    url = "http://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&per_page=300&date=2022"
    response = requests.get(url)
    data = response.json()[1]
    
    gdp_data = {}
    for item in data:
        country = item['country']['value']
        if item['value'] is not None:
            gdp_data[country] = round(item['value'] / 1e9, 2)  # Convert to billions
    return gdp_data

def get_flag_urls():
    """Get flag URLs from Flagpedia"""
    base_url = "https://flagcdn.com/w320/{}.png"
    # List of ISO country codes (you might want to expand this)
    country_codes = {
        "United States": "us",
        "China": "cn",
        "Japan": "jp",
        "Germany": "de",
        "United Kingdom": "gb",
        "France": "fr",
        "India": "in",
        "Italy": "it",
        "Brazil": "br",
        "Canada": "ca",
        # Add more countries as needed
    }
    return {country: base_url.format(code) for country, code in country_codes.items()}

def get_top_exports():
    """Get top export data (simplified version)"""
    # This is a simplified version. In a real application, you would use BACI data
    # or another comprehensive trade database
    return {
        "United States": "Aircraft",
        "China": "Electronics",
        "Japan": "Vehicles",
        "Germany": "Machinery",
        "United Kingdom": "Financial Services",
        "France": "Aircraft",
        "India": "Software Services",
        "Italy": "Fashion",
        "Brazil": "Soybeans",
        "Canada": "Oil",
        # Add more countries as needed
    }

def prepare_country_data():
    """Combine all data sources into a single JSON file"""
    gdp_data = get_world_bank_gdp()
    flag_urls = get_flag_urls()
    export_data = get_top_exports()
    
    # Combine all data
    country_data = {}
    for country in set(gdp_data.keys()) & set(flag_urls.keys()) & set(export_data.keys()):
        country_data[country] = {
            "gdp": gdp_data[country],
            "flag": flag_urls[country],
            "top_export": export_data[country]
        }
    
    # Save to JSON file
    output_path = Path(__file__).parent.parent / 'backend' / 'data' / 'countries_data.json'
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(country_data, f, indent=2)
    
    print(f"Data prepared and saved to {output_path}")
    print(f"Total countries: {len(country_data)}")

if __name__ == "__main__":
    prepare_country_data() 