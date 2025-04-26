import React from 'react';
import { Box } from '@mui/material';
import { RED_JOKER, BLACK_JOKER } from '../shared/cardUtils';

const Card = ({ suit, value, selected, onClick }) => {
  const isRed = suit === '♥' || suit === '♦' || suit === RED_JOKER;
  const isBlack = suit === '♠' || suit === '♣' || suit === BLACK_JOKER;
  
  return (
    <Box
      onClick={onClick}
      sx={{
        width: 80,
        height: 120,
        backgroundColor: selected ? '#e3f2fd' : 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '8px',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 10px #2196f3' : 'none',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box sx={{ 
        color: isRed ? 'red' : isBlack ? 'black' : 'inherit',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        textAlign: 'left'
      }}>
        {value === 'JOKER' ? (suit === RED_JOKER ? '🃏' : '🃟') : value}
      </Box>
      <Box sx={{ 
        color: isRed ? 'red' : isBlack ? 'black' : 'inherit',
        fontSize: '2.5rem',
        textAlign: 'center'
      }}>
        {value === 'JOKER' ? (suit === RED_JOKER ? '🃏' : '🃟') : suit}
      </Box>
      <Box sx={{ 
        color: isRed ? 'red' : isBlack ? 'black' : 'inherit',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        textAlign: 'right',
        transform: 'rotate(180deg)'
      }}>
        {value === 'JOKER' ? (suit === RED_JOKER ? '🃏' : '🃟') : value}
      </Box>
    </Box>
  );
};

export default Card; 