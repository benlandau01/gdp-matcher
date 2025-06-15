from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import random
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS with specific settings
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://gdp-matcher.vercel.app",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Log all requests
@app.before_request
def log_request_info():
    logger.info('Headers: %s', request.headers)
    logger.info('Body: %s', request.get_data())

# Load country data
DATA_FILE = 'data/game_data_with_flags.json'

def load_country_data():
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
            return {item['country']: {
                'gdp': item.get('GDP', 'N/A'),
                'flag': item.get('flag_url', ''),
                'top_export': item.get('top_export', 'N/A')
            } for item in data if 'country' in item}
    except Exception as e:
        logger.error(f"Error loading data file: {e}")
        return {}

def filter_countries_by_difficulty(data, difficulty):
    if difficulty == 'easy':
        return {country: info for country, info in data.items() 
                if isinstance(info['gdp'], (int, float)) and info['gdp'] > 500_000_000_000}
    elif difficulty == 'medium':
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

@app.route('/api/health', methods=['GET'])
def health_check():
    logger.info('Health check requested')
    return jsonify({"status": "healthy"}), 200

@app.route('/api/game', methods=['GET'])
def get_game_data():
    try:
        logger.info('Game data requested')
        difficulty = request.args.get('difficulty', 'medium')
        data = get_random_countries(difficulty=difficulty)
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error in get_game_data: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/validate_matches', methods=['POST'])
def validate_matches():
    try:
        logger.info('Validate matches requested')
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
    except Exception as e:
        logger.error(f"Error in validate_matches: {e}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port) 