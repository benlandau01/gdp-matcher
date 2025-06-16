# GDP Matcher Game

An interactive web application where players match countries with their GDP, flags, and top export categories. Built with Flask and React.

## Features

- Beautiful UI with country flags
- Data from reliable sources (World Bank, BACI, Flagpedia)
- Score tracking and replay functionality

## Project Structure

```
gdp-matcher/
├── backend/           # Flask application
│   ├── app.py        # Main Flask application
│   ├── data/         # Data files
│   └── requirements.txt
├── frontend/         # React application
│   ├── src/         # Source files
│   ├── public/      # Static files
│   └── package.json
└── scripts/         # Data preparation scripts
    └── prepare_data.py
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Run the Flask server:
```bash
python app.py
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

## Data Sources

- GDP Data: World Bank API
- Export Data: BACI Database
- Country Flags: Flagpedia API

## License

MIT 
