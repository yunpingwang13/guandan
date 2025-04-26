import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, TextField, Button, Paper } from '@mui/material';
import { io } from 'socket.io-client';
import Game from './components/Game';

const socket = io('http://localhost:5000');

function App() {
  const [roomId, setRoomId] = useState('');
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState('');
  const [playerNames, setPlayerNames] = useState([]);
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      setPlayerId(socket.id);
    });

    socket.on('roomCreated', (id) => {
      setRoomId(id);
      setError('');
      setPlayerNames(['Player 1']);
      setError(`Players in room: 1/4`);
    });

    socket.on('playerJoined', (data) => {
      setPlayerNames(data.playerNames);
      setError(`Players in room: ${data.playerCount}/4`);
    });

    socket.on('gameStarted', (data) => {
      setGameState(data);
      setError('');
    });

    socket.on('error', (message) => {
      setError(message);
    });

    return () => {
      socket.off('connect');
      socket.off('roomCreated');
      socket.off('playerJoined');
      socket.off('gameStarted');
      socket.off('error');
    };
  }, []);

  const handleCreateRoom = () => {
    socket.emit('createRoom', roomId);
  };

  const handleJoinRoom = () => {
    socket.emit('joinRoom', roomId);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Guandan Game
        </Typography>
        {!gameState ? (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                fullWidth
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleCreateRoom}
                  fullWidth
                >
                  Create Room
                </Button>
                <Button
                  variant="contained"
                  onClick={handleJoinRoom}
                  fullWidth
                >
                  Join Room
                </Button>
              </Box>
              {error && (
                <Typography color="error" align="center">
                  {error}
                </Typography>
              )}
              {playerNames.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" align="center">
                    Players in room:
                  </Typography>
                  {playerNames.map((name, index) => (
                    <Typography key={index} align="center">
                      {name}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Paper>
        ) : (
          <Game
            gameState={gameState}
            socket={socket}
            roomId={roomId}
            playerId={playerId}
          />
        )}
      </Box>
    </Container>
  );
}

export default App;
