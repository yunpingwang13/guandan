import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import Card from './Card';
import { getCardValue, compareCards, isValidCombination, canBeatLastPlay } from '../shared/cardUtils';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

const Game = ({ gameState, socket, roomId, playerId }) => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [currentHand, setCurrentHand] = useState([]);
  const [lastPlay, setLastPlay] = useState(null);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [passes, setPasses] = useState(0);

  const getCardValue = useCallback((card) => {
    if (!card || !card.value) return 0;
    if (card.value === 'JOKER') return 16; // Jokers are highest
    if (card.value === '2') return 15; // 2s are second highest
    if (card.value === 'A') return 14; // Aces are third highest
    if (card.value === 'K') return 13;
    if (card.value === 'Q') return 12;
    if (card.value === 'J') return 11;
    return VALUES.indexOf(card.value); // Regular cards (3-10)
  }, []);

  const compareCards = useCallback((card1, card2) => {
    if (!card1 || !card2) return 0;
    const value1 = getCardValue(card1);
    const value2 = getCardValue(card2);
    if (value1 !== value2) return value1 - value2;
    if (!card1.suit || !card2.suit) return 0;
    return SUITS.indexOf(card1.suit) - SUITS.indexOf(card2.suit);
  }, [getCardValue]);

  const updateHand = useCallback((newHand) => {
    const validHand = newHand.filter(card => card && card.suit && card.value);
    const sortedHand = [...validHand].sort(compareCards);
    setCurrentHand(sortedHand);
  }, [compareCards]);

  useEffect(() => {
    if (gameState?.hands && playerId) {
      const playerHand = gameState.hands.find(([id]) => id === playerId)?.[1] || [];
      updateHand(playerHand);
      
      if (gameState.players && gameState.currentPlayer !== undefined) {
        setIsYourTurn(gameState.currentPlayer === gameState.players.indexOf(playerId));
      }
    }
  }, [gameState, playerId, updateHand]);

  useEffect(() => {
    if (!socket) return;

    const handleCardsPlayed = (data) => {
      if (data.cards) {
        // Filter out invalid cards and sort
        const validCards = data.cards
          .filter(card => card && card.suit && card.value)
          .sort(compareCards);
        setLastPlay({ ...data, cards: validCards });
        setPasses(0);

        // If this player played the cards, update their hand
        if (data.playerId === playerId) {
          const newHand = currentHand.filter(card => 
            !validCards.some(playedCard => 
              playedCard.suit === card.suit && playedCard.value === card.value
            )
          );
          updateHand(newHand);
        }
      } else {
        setLastPlay(data);
      }
      if (data.passes !== undefined) {
        setPasses(data.passes);
      }
      if (gameState?.players && data.currentPlayer !== undefined) {
        setIsYourTurn(data.currentPlayer === gameState.players.indexOf(playerId));
      }
    };

    const handleGameOver = (data) => {
      alert(`Game Over! Team ${data.winningTeam + 1} wins!`);
    };

    const handlePass = (data) => {
      if (data.passes !== undefined) {
        setPasses(data.passes);
      }
      if (gameState?.players && data.currentPlayer !== undefined) {
        setIsYourTurn(data.currentPlayer === gameState.players.indexOf(playerId));
      }
    };

    socket.on('cardsPlayed', handleCardsPlayed);
    socket.on('gameOver', handleGameOver);
    socket.on('pass', handlePass);

    return () => {
      socket.off('cardsPlayed', handleCardsPlayed);
      socket.off('gameOver', handleGameOver);
      socket.off('pass', handlePass);
    };
  }, [socket, gameState, playerId, currentHand, compareCards, updateHand]);

  const handleCardClick = (card, index) => {
    if (!card || !card.suit || !card.value) return;
    
    // Find the group this card belongs to
    const cardGroup = cardGroups.find(([_, cards]) => 
      cards.some(c => c.card.suit === card.suit && c.card.value === card.value)
    );
    
    if (!cardGroup) return;
    
    const [_, cards] = cardGroup;
    // Find the index of the clicked card in its group
    const clickedCardIndex = cards.findIndex(c => 
      c.card.suit === card.suit && c.card.value === card.value
    );
    
    setSelectedCards(prev => {
      // Get all cards below and including the clicked card
      const cardsToToggle = cards.slice(clickedCardIndex);
      
      // Check if all these cards are already selected
      const allSelected = cardsToToggle.every(({ card: c, index: i }) => 
        prev.some(selected => 
          selected.index === i && 
          selected.card.suit === c.suit && 
          selected.card.value === c.value
        )
      );
      
      if (allSelected) {
        // If all are selected, deselect them
        return prev.filter(selected => 
          !cardsToToggle.some(({ card: c, index: i }) => 
            selected.index === i && 
            selected.card.suit === c.suit && 
            selected.card.value === c.value
          )
        );
      } else {
        // If not all are selected, select them
        const newSelections = cardsToToggle.map(({ card: c, index: i }) => ({ card: c, index: i }));
        return [...prev.filter(selected => 
          !cardsToToggle.some(({ card: c, index: i }) => 
            selected.index === i && 
            selected.card.suit === c.suit && 
            selected.card.value === c.value
          )
        ), ...newSelections];
      }
    });
  };

  const handlePlayCards = () => {
    if (selectedCards.length === 0) return;
    const validCards = selectedCards
      .sort((a, b) => a.index - b.index)
      .map(({ card }) => card)
      .filter(card => card && card.suit && card.value)
      .sort(compareCards);
    
    if (!isValidCombination(validCards)) {
      alert('Invalid card combination!');
      return;
    }

    // Allow any valid combination if all other players have passed
    if (passes >= 3) {
      socket.emit('playCards', { roomId, cards: validCards });
      setSelectedCards([]);
      return;
    }

    if (lastPlay?.cards && !canBeatLastPlay(validCards, lastPlay.cards)) {
      alert('Your cards cannot beat the last play!');
      return;
    }
    
    socket.emit('playCards', { roomId, cards: validCards });
    setSelectedCards([]);
  };

  const handlePass = () => {
    socket.emit('playCards', { roomId, cards: [] });
  };

  // Group cards by value for cascading display
  const groupCardsByValue = (cards) => {
    const groups = {};
    cards.forEach((card, index) => {
      const value = card.value;
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push({ card, index });
    });

    // Sort the groups by card value in descending order and return as array
    return Object.entries(groups)
      .sort(([valueA], [valueB]) => {
        const cardA = { value: valueA };
        const cardB = { value: valueB };
        return getCardValue(cardB) - getCardValue(cardA); // Sort in descending order
      });
  };

  if (!gameState || !playerId) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>Loading game...</Typography>
      </Box>
    );
  }

  if (!gameState.players || !gameState.hands) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>Waiting for game to start...</Typography>
      </Box>
    );
  }

  const cardGroups = groupCardsByValue(currentHand);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: 2,
      p: 2
    }}>
      <Paper elevation={3} sx={{ p: 2, width: '100%' }}>
        <Typography variant="h6" align="center">
          Game Board
        </Typography>
        {lastPlay?.cards && lastPlay.cards.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, my: 2 }}>
            {lastPlay.cards.map((card, index) => (
              <Card
                key={`${card.suit}-${card.value}-${index}`}
                suit={card.suit}
                value={card.value}
                selected={false}
              />
            ))}
            <Typography variant="body1" sx={{ ml: 2 }}>
              Played by: {lastPlay.playerName}
            </Typography>
          </Box>
        )}
      </Paper>

      <Paper elevation={3} sx={{ p: 2, width: '100%' }}>
        <Typography variant="h6" align="center">
          Your Hand
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 2,
          minHeight: '300px',
          my: 2,
          padding: '20px 0',
          width: '100%'
        }}>
          {cardGroups.map(([value, cards]) => (
            <Box 
              key={value}
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                flex: '1 0 auto'
              }}
            >
              {cards.map(({ card, index }, cardIndex) => (
                <Box
                  key={`${card.suit}-${card.value}-${index}`}
                  sx={{
                    position: 'relative',
                    zIndex: cardIndex,
                    marginTop: cardIndex > 0 ? '-80px' : 0,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      zIndex: cards.length,
                      '& ~ *': {
                        transform: 'translateY(-5px)',
                        opacity: 0.8,
                        zIndex: cards.length
                      }
                    }
                  }}
                >
                  <Card
                    suit={card.suit}
                    value={card.value}
                    selected={selectedCards.some(selected => 
                      selected.index === index && 
                      selected.card.suit === card.suit && 
                      selected.card.value === card.value
                    )}
                    onClick={() => handleCardClick(card, index)}
                  />
                </Box>
              ))}
            </Box>
          ))}
        </Box>
        {isYourTurn && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handlePlayCards}
              disabled={selectedCards.length === 0}
            >
              Play Cards
            </Button>
            <Button
              variant="outlined"
              onClick={handlePass}
            >
              Pass
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Game; 