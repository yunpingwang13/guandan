const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
const RED_JOKER = '🃏'; // Red joker
const BLACK_JOKER = '🃏'; // Black joker

const getCardValue = (card) => {
  if (!card || !card.value) return 0;
  if (card.value === 'JOKER') {
    // Red joker is higher than black joker
    return card.suit === RED_JOKER ? 17 : 16;
  }
  if (card.value === '2') return 15; // 2s are second highest
  if (card.value === 'A') return 14; // Aces are third highest
  if (card.value === 'K') return 13;
  if (card.value === 'Q') return 12;
  if (card.value === 'J') return 11;
  return VALUES.indexOf(card.value) + 3; // Regular cards (3-K)
};

const compareCards = (card1, card2) => {
  if (!card1 || !card2) return 0;
  const value1 = getCardValue(card1);
  const value2 = getCardValue(card2);
  if (value1 !== value2) return value1 - value2;
  if (!card1.suit || !card2.suit) return 0;
  return SUITS.indexOf(card1.suit) - SUITS.indexOf(card2.suit);
};

const getValueCounts = (cards) => {
  const valueCounts = {};
  cards.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });
  return valueCounts;
};

const isStraight = (cards) => {
  const values = cards.map(card => VALUES.indexOf(card.value));
  return values.every((value, index) => 
    index === 0 || value === values[index - 1] + 1
  );
};

const isFlush = (cards) => {
  return cards.every(card => card.suit === cards[0].suit);
};

const getCombinationType = (cards) => {
  if (!cards || cards.length === 0) return null;
  const sortedCards = [...cards].sort(compareCards);
  
  // Check for bombs first
  if (cards.length === 4 && sortedCards.every(card => card.value === sortedCards[0].value)) {
    return sortedCards[0].value === 'JOKER' ? 'FOUR_JOKERS' : 'FOUR_OF_A_KIND';
  }
  if (cards.length === 5 && sortedCards.every(card => card.value === sortedCards[0].value)) {
    return 'FIVE_OF_A_KIND';
  }
  if (cards.length === 5 && isStraight(sortedCards) && isFlush(sortedCards)) {
    return 'STRAIGHT_FLUSH';
  }
  if (cards.length === 6 && sortedCards.every(card => card.value === sortedCards[0].value)) {
    return 'SIX_OF_A_KIND';
  }
  if (cards.length === 7 && sortedCards.every(card => card.value === sortedCards[0].value)) {
    return 'SEVEN_OF_A_KIND';
  }
  if (cards.length === 8 && sortedCards.every(card => card.value === sortedCards[0].value)) {
    return 'EIGHT_OF_A_KIND';
  }

  // Check for regular combinations
  if (cards.length === 1) return 'SINGLE';
  if (cards.length === 2) {
    if (sortedCards[0].value === sortedCards[1].value) {
      // For jokers, they must be of the same suit
      if (sortedCards[0].value === 'JOKER') {
        return sortedCards[0].suit === sortedCards[1].suit ? 'PAIR' : null;
      }
      return 'PAIR';
    }
    return null;
  }
  if (cards.length === 3) {
    // Three jokers are not a valid three of a kind
    if (sortedCards[0].value === 'JOKER') return null;
    if (sortedCards.every(card => card.value === sortedCards[0].value)) return 'THREE_OF_A_KIND';
    return null;
  }
  if (cards.length === 5) {
    const valueCounts = getValueCounts(sortedCards);
    const counts = Object.values(valueCounts);
    if (counts.length === 2 && 
        ((counts[0] === 3 && counts[1] === 2) || 
         (counts[0] === 2 && counts[1] === 3))) {
      // Full house cannot contain jokers
      if (sortedCards.some(card => card.value === 'JOKER')) return null;
      return 'FULL_HOUSE';
    }
    if (isStraight(sortedCards)) {
      return 'STRAIGHT';
    }
  }
  return null;
};

const getBombPriority = (type) => {
  const priorities = {
    'FOUR_OF_A_KIND': 1,
    'FIVE_OF_A_KIND': 2,
    'STRAIGHT_FLUSH': 3,
    'SIX_OF_A_KIND': 4,
    'SEVEN_OF_A_KIND': 5,
    'EIGHT_OF_A_KIND': 6,
    'FOUR_JOKERS': 7
  };
  return priorities[type] || 0;
};

const isValidCombination = (cards) => {
  return getCombinationType(cards) !== null;
};

const canBeatLastPlay = (cards, lastCards) => {
  if (!lastCards || !lastCards.length) return true;

  const currentType = getCombinationType(cards);
  const lastType = getCombinationType(lastCards);

  if (!currentType || !lastType) return false;

  // Check if either is a bomb
  const currentIsBomb = getBombPriority(currentType) > 0;
  const lastIsBomb = getBombPriority(lastType) > 0;

  if (currentIsBomb && lastIsBomb) {
    // Compare bomb priorities
    const currentPriority = getBombPriority(currentType);
    const lastPriority = getBombPriority(lastType);
    if (currentPriority !== lastPriority) {
      return currentPriority > lastPriority;
    }
    // If priorities are equal, compare highest cards
    const sortedCards = [...cards].sort(compareCards);
    const sortedLastCards = [...lastCards].sort(compareCards);
    return compareCards(sortedCards[sortedCards.length - 1], 
                       sortedLastCards[sortedLastCards.length - 1]) > 0;
  }
  if (currentIsBomb) return true;
  if (lastIsBomb) return false;

  // If all other players have passed (lastCards is empty), allow any valid combination
  if (lastCards.length === 0) return true;

  // Same type comparison
  if (currentType !== lastType) return false;

  // Sort both sets of cards
  const sortedCards = [...cards].sort(compareCards);
  const sortedLastCards = [...lastCards].sort(compareCards);

  if (currentType === 'FULL_HOUSE') {
    // For full house, compare the triplet values
    const getTripletValue = (cards) => {
      const valueCounts = getValueCounts(cards);
      for (const [value, count] of Object.entries(valueCounts)) {
        if (count === 3) return value;
      }
      return null;
    };

    const currentTriplet = getTripletValue(sortedCards);
    const lastTriplet = getTripletValue(sortedLastCards);
    return compareCards(
      { value: currentTriplet, suit: sortedCards[0].suit },
      { value: lastTriplet, suit: sortedLastCards[0].suit }
    ) > 0;
  }

  // For other combinations, compare highest cards
  return compareCards(sortedCards[sortedCards.length - 1], 
                     sortedLastCards[sortedLastCards.length - 1]) > 0;
};

module.exports = {
  SUITS,
  VALUES,
  RED_JOKER,
  BLACK_JOKER,
  getCardValue,
  compareCards,
  isValidCombination,
  canBeatLastPlay
}; 