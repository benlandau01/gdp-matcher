import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Alert,
  ThemeProvider,
  createTheme,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import axios from 'axios';

// Use Render backend URL
const API_URL = 'https://gdp-matcher.onrender.com';

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Cache-Control'] = 'no-cache';

// Create a theme with Inter font
const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
          fontWeight: 500,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
          fontWeight: 500,
        },
      },
    },
  },
});

// Add global styles for the spinner animation
const globalStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function formatGDP(value) {
  if (value >= 1_000_000_000_000) {
    const trillions = value / 1_000_000_000_000;
    return `$${trillions.toPrecision(3)}T`;
  } else if (value >= 1_000_000_000) {
    const billions = value / 1_000_000_000;
    return `$${billions.toPrecision(3)}B`;
  } else if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `$${millions.toPrecision(3)}M`;
  } else {
    return `$${value.toPrecision(3)}`;
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function LoadingScreen({ message }) {
  return (
    <ThemeProvider theme={theme}>
      <style>{globalStyles}</style>
      <Container maxWidth="lg" sx={{ 
        py: 4, 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 9999
      }}>
        <Typography variant="h4" sx={{ color: 'navy', mb: 2 }}>
          GDP Matcher Game
        </Typography>
        <Typography variant="h6" sx={{ color: '#1695ff', mb: 4 }}>
          {message}
        </Typography>
        <Box sx={{ 
          width: 50, 
          height: 50, 
          border: '3px solid #f3f3f3', 
          borderTop: '3px solid #1695ff', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite'
        }} />
      </Container>
    </ThemeProvider>
  );
}

function App() {
  const [gameData, setGameData] = useState(null);
  const [matches, setMatches] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Waking up the server... This may take up to a minute on first load.');
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedItems, setSelectedItems] = useState({
    countries: null,
    gdps: null,
    flags: null,
    exports: null,
  });
  const [correctMatches, setCorrectMatches] = useState({});
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleDifficultyChange = (event, newDifficulty) => {
    if (newDifficulty !== null) {
      setDifficulty(newDifficulty);
      // Reset game state when difficulty changes
      setMatches({});
      setFeedback(null);
      setShowFeedback(false);
      setShowCompletion(false);
      setCorrectMatches({});
      setSelectedItems({
        countries: null,
        gdps: null,
        flags: null,
        exports: null,
      });
      setTimer(0);
      setIsTimerRunning(false);
      setGameStarted(false);
      fetchGameData(newDifficulty);
    }
  };

  const fetchGameData = async (selectedDifficulty = difficulty) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Waking up the server... This may take up to a minute on first load.');
      setError(null);
      
      // Force absolute URL
      const url = new URL('/api/game', API_URL);
      url.searchParams.append('difficulty', selectedDifficulty);
      const fullUrl = url.toString();
      
      console.log('Environment:', process.env.NODE_ENV);
      console.log('API URL:', API_URL);
      console.log('Full request URL:', fullUrl);
      
      const config = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        timeout: 30000,
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        }
      };
      
      console.log('Making request with config:', config);
      const response = await axios.get(fullUrl, config);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Game data received successfully:', response.data);
      
      if (!response.data || !response.data.countries || response.data.countries.length === 0) {
        throw new Error('Invalid response data received from server');
      }
      
      setGameData(response.data);
      setMatches({});
      setFeedback(null);
      setSelectedItems({
        countries: null,
        gdps: null,
        flags: null,
        exports: null,
      });
      setCorrectMatches(response.data.correct_matches || {});
      setIsLoading(false);
      setGameStarted(true);
      setIsTimerRunning(true);
    } catch (error) {
      console.error('Error fetching game data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        } : 'No response',
        config: error.config,
        url: error.config?.url
      });
      setError('Failed to load game data. Please try again in a few moments.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGameData();
  }, []);

  const handleItemClick = (type, index) => {
    setSelectedItems(prev => {
      const newSelected = {
        ...prev,
        [type]: prev[type] === index ? null : index
      };
      
      // If we have a complete set of selections, create the match
      if (Object.values(newSelected).every(item => item !== null)) {
        const country = gameData.countries[newSelected.countries];
        const gdp = gameData.gdps[newSelected.gdps];
        const flag = gameData.flags[newSelected.flags];
        const export_item = gameData.exports[newSelected.exports];
        
        setMatches(prevMatches => ({
          ...prevMatches,
          [country]: {
            gdp,
            flag,
            top_export: export_item,
            indices: {
              gdp: newSelected.gdps,
              flag: newSelected.flags,
              export: newSelected.exports
            }
          }
        }));
      }
      
      return newSelected;
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/validate_matches`, {
        matches,
        correct_matches: gameData.correct_matches,
      });
      setFeedback(response.data);
      setShowFeedback(true);

      // Update correct matches for visual feedback
      const newCorrectMatches = { ...correctMatches }; // Preserve existing correct matches
      Object.entries(response.data.feedback).forEach(([country, data]) => {
        if (data.score === 3) { // All matches are correct
          newCorrectMatches[country] = true;
        }
      });
      setCorrectMatches(newCorrectMatches);

      // Check if all matches are correct
      if (Object.keys(newCorrectMatches).length === 5) {
        setShowCompletion(true);
        setIsTimerRunning(false); // Stop the timer when all matches are correct
      }

      // Clear current selections after submission
      setSelectedItems({
        countries: null,
        gdps: null,
        flags: null,
        exports: null,
      });
    } catch (error) {
      console.error('Error submitting matches:', error);
    }
  };

  const handleNewGame = () => {
    setShowCompletion(false);
    fetchGameData();
  };

  const renderColumn = (type, items) => (
    <Box sx={{ minHeight: 400, p: 2 }}>
      {items.map((item, index) => {
        const isSelected = selectedItems[type] === index;
        
        // Determine if this item is part of a correct match
        let isPartOfCorrectMatch = false;
        if (type === 'countries') {
          isPartOfCorrectMatch = correctMatches[item] === true;
        } else {
          // For other columns, check if they're part of any correct match
          Object.entries(correctMatches).forEach(([country, isCorrect]) => {
            if (isCorrect) {
              const correctData = gameData.correct_matches[country];
              const matchData = matches[country];
              if (matchData && matchData.indices) {
                // Check both the value and the index to ensure uniqueness
                if (item === correctData[type === 'gdps' ? 'gdp' : type === 'flags' ? 'flag' : 'top_export'] &&
                    index === matchData.indices[type === 'gdps' ? 'gdp' : type === 'flags' ? 'flag' : 'export']) {
                  isPartOfCorrectMatch = true;
                }
              }
            }
          });
        }
        
        return (
          <Card
            key={`${type}-${index}`}
            onClick={() => !isPartOfCorrectMatch && handleItemClick(type, index)}
            sx={{
              mb: 2,
              cursor: isPartOfCorrectMatch ? 'default' : 'pointer',
              height: { xs: '120px', sm: '100px' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #D0D0D0',
              backgroundColor: isPartOfCorrectMatch ? '#157000' : isSelected ? '#4CAF50' : '#f9f9f9',
              color: isPartOfCorrectMatch ? 'white' : 'inherit',
              '&:hover': {
                boxShadow: isPartOfCorrectMatch ? 0 : 3,
              },
              opacity: isPartOfCorrectMatch ? 1 : 1,
            }}
          >
            <CardContent sx={{ width: '100%', textAlign: 'center' }}>
              {type === 'flags' ? (
                <img
                  src={item}
                  alt="Country flag"
                  style={{
                    width: 'auto',
                    height: { xs: '80px', sm: '60px' },
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <Typography
                  sx={{
                    fontSize: {
                      xs: type === 'gdps' ? '1.3rem' : type === 'exports' ? '0.8rem' : '1.4rem',
                      sm: type === 'gdps' ? '1.1rem' : type === 'exports' ? '0.6rem' : '1.2rem'
                    },
                    fontWeight: type === 'gdps' ? 'bold' : 'normal',
                  }}
                >
                  {type === 'gdps' ? formatGDP(Number(item)) : item}
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );

  // Show loading screen immediately
  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: 'navy', marginBottom: '20px' }}>GDP Matcher Game</h1>
        <p style={{ color: '#1695ff', marginBottom: '20px' }}>{loadingMessage}</p>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #1695ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: 'navy', marginBottom: '20px' }}>GDP Matcher Game</h1>
        <p style={{ color: 'red', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => fetchGameData()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1695ff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!gameData) return null;

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography 
            variant="h3" 
            component="h1"
            sx={{ color: 'navy' }}
          >
            GDP Matcher Game
          </Typography>
          {gameStarted && (
            <Typography 
              variant="h4" 
              sx={{ 
                fontFamily: 'monospace',
                color: 'navy',
                fontWeight: 600
              }}
            >
              {formatTime(timer)}
            </Typography>
          )}
        </Box>

        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={difficulty}
            exclusive
            onChange={handleDifficultyChange}
            aria-label="game difficulty"
          >
            <ToggleButton value="easy" aria-label="easy mode">
              Easy (GDP &gt; $500B)
            </ToggleButton>
            <ToggleButton value="medium" aria-label="medium mode">
              Medium (GDP &gt; $10B)
            </ToggleButton>
            <ToggleButton value="hard" aria-label="hard mode">
              Hard (All Countries)
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Grid container spacing={{ xs: 1, sm: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3}>
              <Typography 
                variant="h6" 
                p={2} 
                align="center"
                sx={{ 
                  color: '#1695ff',
                  fontSize: { xs: '1.2rem', sm: '1.25rem' }
                }}
              >
                Country
              </Typography>
              {renderColumn('countries', gameData.countries)}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3}>
              <Typography 
                variant="h6" 
                p={2} 
                align="center"
                sx={{ 
                  color: '#1695ff',
                  fontSize: { xs: '1.2rem', sm: '1.25rem' }
                }}
              >
                GDP (USD)
              </Typography>
              {renderColumn('gdps', gameData.gdps)}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3}>
              <Typography 
                variant="h6" 
                p={2} 
                align="center"
                sx={{ 
                  color: '#1695ff',
                  fontSize: { xs: '1.2rem', sm: '1.25rem' }
                }}
              >
                Flag
              </Typography>
              {renderColumn('flags', gameData.flags)}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3}>
              <Typography 
                variant="h6" 
                p={2} 
                align="center"
                sx={{ 
                  color: '#1695ff',
                  fontSize: { xs: '1.2rem', sm: '1.25rem' }
                }}
              >
                Top Export
              </Typography>
              {renderColumn('exports', gameData.exports)}
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={Object.values(selectedItems).some(item => item === null)}
            sx={{ minWidth: '120px' }}
          >
            Submit Matches
          </Button>
          <Button
            variant="outlined"
            onClick={() => fetchGameData()}
            sx={{ minWidth: '120px' }}
          >
            New Game
          </Button>
        </Box>

        <Snackbar
          open={showFeedback}
          autoHideDuration={3000}
          onClose={() => setShowFeedback(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="success" onClose={() => setShowFeedback(false)}>
            {Object.keys(correctMatches).length}/5 matches correct
          </Alert>
        </Snackbar>

        <Snackbar
          open={showCompletion}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity="success" 
            onClose={() => setShowCompletion(false)}
            sx={{ 
              width: '100%',
              '& .MuiAlert-message': {
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }
            }}
          >
            <span>Great job! Do you want to play again?</span>
            <Button 
              variant="contained" 
              size="small" 
              onClick={handleNewGame}
              sx={{ ml: 2 }}
            >
              Play Again
            </Button>
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App; 