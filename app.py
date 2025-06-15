from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import random
from pathlib import Path
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Load country data
DATA_FILE = 'data/game_data_with_flags.json'
logger.info(f"Using data file path: {DATA_FILE}")

def load_country_data():
    try:
        logger.info("Attempting to load country data...")
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
            logger.info(f"Successfully loaded data for {len(data)} countries")
            # Convert array to dictionary with country names as keys
            return {item['country']: {
                'gdp': item.get('GDP', 'N/A'),
                'flag': item.get('flag_url', ''),
                'top_export': item.get('top_export', 'N/A')
            } for item in data if 'country' in item}
    except Exception as e:
        logger.error(f"Error loading data file: {e}")
        logger.error(f"Attempted to load from: {DATA_FILE}")
        # List current directory contents for debugging
        try:
            logger.info("Current directory contents:")
            for item in os.listdir('.'):
                logger.info(f"  - {item}")
            if os.path.exists('data'):
                logger.info("Data directory contents:")
                for item in os.listdir('data'):
                    logger.info(f"  - {item}")
        except Exception as dir_error:
            logger.error(f"Error listing directory contents: {dir_error}")
        return {}

def filter_countries_by_difficulty(data, difficulty):
    if difficulty == 'easy':
        # Filter for countries with GDP > $500B
        return {country: info for country, info in data.items() 
                if isinstance(info['gdp'], (int, float)) and info['gdp'] > 500_000_000_000}
    elif difficulty == 'medium':
        # Filter for countries with GDP > $10B
        return {country: info for country, info in data.items() 
                if isinstance(info['gdp'], (int, float)) and info['gdp'] > 10_000_000_000}
    else:  # hard mode
        return data

def get_random_countries(count=5, difficulty='medium'):
    data = load_country_data()
    filtered_data = filter_countries_by_difficulty(data, difficulty)
    
    if not filtered_data:
        return {
            'countries': [],
            'gdps': [],
            'flags': [],
            'exports': [],
            'correct_matches': {}
        }
    
    selected_countries = random.sample(list(filtered_data.items()), min(count, len(filtered_data)))
    
    # Create shuffled columns
    countries = [country for country, _ in selected_countries]
    gdps = [data[country]['gdp'] for country in countries]
    flags = [data[country]['flag'] for country in countries]
    exports = [data[country]['top_export'] for country in countries]
    
    random.shuffle(countries)
    random.shuffle(gdps)
    random.shuffle(flags)
    random.shuffle(exports)
    
    return {
        'countries': countries,
        'gdps': gdps,
        'flags': flags,
        'exports': exports,
        'correct_matches': {
            country: {
                'gdp': data[country]['gdp'],
                'flag': data[country]['flag'],
                'top_export': data[country]['top_export']
            }
            for country in countries
        }
    }

@app.route('/api/game', methods=['GET'])
def get_game_data():
    try:
        difficulty = request.args.get('difficulty', 'medium')
        logger.info(f"Received request for game data with difficulty: {difficulty}")
        data = get_random_countries(difficulty=difficulty)
        logger.info(f"Returning data for {len(data.get('countries', []))} countries")
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error in get_game_data: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/api/validate_matches', methods=['POST'])
def validate_matches():
    data = request.json
    matches = data['matches']
    correct_matches = data['correct_matches']
    
    score = 0
    feedback = {}
    
    for country, match in matches.items():
        correct = correct_matches[country]
        country_score = 0
        country_feedback = {}
        
        for field in ['gdp', 'flag', 'top_export']:
            if match[field] == correct[field]:
                country_score += 1
                country_feedback[field] = 'correct'
            else:
                country_feedback[field] = 'incorrect'
        
        score += country_score
        feedback[country] = {
            'score': country_score,
            'feedback': country_feedback
        }
    
    return jsonify({
        'total_score': score,
        'max_score': len(matches) * 3,
        'feedback': feedback
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"Starting server on port {port}")
    app.run(debug=True, port=port) 