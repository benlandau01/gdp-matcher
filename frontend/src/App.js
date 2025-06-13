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
} from '@mui/material';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

function App() {
  const [gameData, setGameData] = useState(null);
  const [matches, setMatches] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedItems, setSelectedItems] = useState({
    countries: null,
    gdps: null,
    flags: null,
    exports: null,
  });
  const [correctMatches, setCorrectMatches] = useState({});

  const fetchGameData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/game`);
      setGameData(response.data);
      setMatches({});
      setFeedback(null);
      setSelectedItems({
        countries: null,
        gdps: null,
        flags: null,
        exports: null,
      });
      setCorrectMatches({});
    } catch (error) {
      console.error('Error fetching game data:', error);
    }
  };

  useEffect(() => {
    fetchGameData();
  }, []);

  const handleItemClick = (type, index) => {
    setSelectedItems(prev => ({
      ...prev,
      [type]: prev[type] === index ? null : index
    }));
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
      const newCorrectMatches = {};
      Object.entries(response.data.feedback).forEach(([country, data]) => {
        if (data.score === 3) { // All matches are correct
          newCorrectMatches[country] = true;
        }
      });
      setCorrectMatches(newCorrectMatches);
    } catch (error) {
      console.error('Error submitting matches:', error);
    }
  };

  const renderColumn = (type, items) => (
    <Box sx={{ minHeight: 400, p: 2 }}>
      {items.map((item, index) => {
        const isSelected = selectedItems[type] === index;
        const isCorrect = Object.values(correctMatches).some(match => match);
        
        return (
          <Card
            key={`${type}-${index}`}
            onClick={() => handleItemClick(type, index)}
            sx={{
              mb: 2,
              cursor: 'pointer',
              height: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isSelected ? '3px solid #4caf50' : '3px solid transparent',
              backgroundColor: isCorrect ? 'rgba(76, 175, 80, 0.1)' : 'white',
              '&:hover': {
                boxShadow: 3,
              },
            }}
          >
            <CardContent sx={{ width: '100%', textAlign: 'center' }}>
              {type === 'flags' ? (
                <img
                  src={item}
                  alt="Country flag"
                  style={{
                    width: 'auto',
                    height: '60px',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <Typography
                  sx={{
                    fontSize: type === 'gdps' ? '1.1rem' : '1.2rem',
                    fontWeight: type === 'gdps' ? 'bold' : 'normal',
                  }}
                >
                  {item}
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );

  if (!gameData) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        GDP Matcher Game
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper elevation={3}>
            <Typography variant="h6" p={2}>
              Countries
            </Typography>
            {renderColumn('countries', gameData.countries)}
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3}>
            <Typography variant="h6" p={2}>
              GDP (Billions USD)
            </Typography>
            {renderColumn('gdps', gameData.gdps)}
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3}>
            <Typography variant="h6" p={2}>
              Flags
            </Typography>
            {renderColumn('flags', gameData.flags)}
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3}>
            <Typography variant="h6" p={2}>
              Top Exports
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
          disabled={Object.keys(matches).length === 0}
          sx={{ minWidth: '120px' }}
        >
          Submit Matches
        </Button>
        <Button
          variant="outlined"
          onClick={fetchGameData}
          sx={{ minWidth: '120px' }}
        >
          New Game
        </Button>
      </Box>

      <Snackbar
        open={showFeedback}
        autoHideDuration={6000}
        onClose={() => setShowFeedback(false)}
      >
        <Alert
          onClose={() => setShowFeedback(false)}
          severity={feedback?.total_score === feedback?.max_score ? 'success' : 'info'}
          sx={{ width: '100%' }}
        >
          {feedback
            ? `Score: ${feedback.total_score}/${feedback.max_score}`
            : 'Error submitting matches'}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App; 