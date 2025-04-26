import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

const Card = ({ suit, value, selected, onClick }) => {
  // Return null if card data is missing
  if (!suit || !value) {
    return null;
  }

  const getSuitColor = (suit) => {
    return suit === '♥' || suit === '♦' ? 'red' : 'black';
  };

  return (
    <Paper
      elevation={selected ? 8 : 2}
      onClick={onClick}
      sx={{
        width: 80,
        height: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 1,
        cursor: 'pointer',
        backgroundColor: selected ? '#e3f2fd' : 'white',
        '&:hover': {
          transform: 'translateY(-5px)',
          transition: 'transform 0.2s',
        },
      }}
    >
      <Box sx={{ color: getSuitColor(suit) }}>
        <Typography variant="h6">{value}</Typography>
        <Typography variant="h6">{suit}</Typography>
      </Box>
      <Box sx={{ color: getSuitColor(suit), transform: 'rotate(180deg)' }}>
        <Typography variant="h6">{value}</Typography>
        <Typography variant="h6">{suit}</Typography>
      </Box>
    </Paper>
  );
};

export default Card; 