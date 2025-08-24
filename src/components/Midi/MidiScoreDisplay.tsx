'use client';

import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Progress,
  Grid,
  Card,
} from '@chakra-ui/react';

interface GameState {
  isPlaying: boolean;
  isPracticeMode: boolean;
  isSessionActive: boolean;
  score: number;
  streak: number;
  totalNotes: number;
  hitNotes: number;
  perfectHits: number;
  goodHits: number;
  lateHits: number;
  earlyHits: number;
  missedNotes: number;
  extraNotes: number;
  accuracy: number;
  stars: number;
}

interface MidiScoreDisplayProps {
  gameState: GameState;
  isGameEnabled: boolean;
}

export function MidiScoreDisplay({ gameState, isGameEnabled }: MidiScoreDisplayProps) {
  const renderStars = (stars: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Text key={i} fontSize="sm" color={i < stars ? 'yellow.400' : 'gray.300'}>
        ⭐
      </Text>
    ));
  };

  if (!isGameEnabled) {
    return (
      <Box p={3} bg="gray.100" borderRadius="md" opacity={0.7}>
        <Text fontSize="sm" textAlign="center" color="gray.600">
          🎮 Enable MIDI Game mode to see scoring
        </Text>
      </Box>
    );
  }

  if (gameState.isPracticeMode) {
    return (
      <Box p={3} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
        <Text fontSize="sm" textAlign="center" color="blue.700">
          🎮 Hit play to start a new game session!
        </Text>
      </Box>
    );
  }

  return (
    <Box p={3} bg="gradient-to-r from-purple-50 to-blue-50" borderRadius="md" borderWidth="1px" borderColor="purple.200">
      <VStack align="stretch" gap={3}>
        <HStack justify="space-between" align="center">
          <Text fontSize="md" fontWeight="bold" color="purple.700">
            🎮 {gameState.isPracticeMode ? 'Practice Mode' : 'Score Mode'}
          </Text>
          <Badge colorScheme={gameState.isPlaying ? 'green' : 'yellow'} size="sm">
            {gameState.isPlaying ? 'Playing' : 'Paused'}
          </Badge>
        </HStack>

        {/* Main Score Display */}
        <Grid templateColumns="repeat(auto-fit, minmax(80px, 1fr))" gap={2}>
          <Card.Root p={2} bg="white" size="sm">
            <Text fontSize="xs" opacity={0.8} textAlign="center">Score</Text>
            <Text fontSize="lg" fontWeight="bold" textAlign="center" color="purple.600">
              {gameState.score}
            </Text>
          </Card.Root>

          <Card.Root p={2} bg="white" size="sm">
            <Text fontSize="xs" opacity={0.8} textAlign="center">Accuracy</Text>
            <Text fontSize="lg" fontWeight="bold" textAlign="center" color="blue.600">
              {gameState.accuracy.toFixed(1)}%
            </Text>
          </Card.Root>

          <Card.Root p={2} bg="white" size="sm">
            <Text fontSize="xs" opacity={0.8} textAlign="center">Streak</Text>
            <Text fontSize="lg" fontWeight="bold" textAlign="center" color="green.600">
              {gameState.streak}
            </Text>
          </Card.Root>

          <Card.Root p={2} bg="white" size="sm">
            <Text fontSize="xs" opacity={0.8} textAlign="center">Stars</Text>
            <HStack justify="center" gap={0}>
              {renderStars(gameState.stars)}
            </HStack>
          </Card.Root>
        </Grid>

        {/* Progress Bar */}
        {gameState.totalNotes > 0 && (
          <Box>
            <HStack justify="space-between" mb={1}>
              <Text fontSize="xs" color="gray.600">Progress</Text>
              <Text fontSize="xs" color="gray.600">
                {gameState.hitNotes + gameState.missedNotes} / {gameState.totalNotes}
              </Text>
            </HStack>
            <Progress.Root
              value={((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100}
              colorScheme="purple"
              size="sm"
            >
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
          </Box>
        )}

        {/* Quick Stats */}
        <HStack justify="space-around" fontSize="xs">
          <VStack gap={0}>
            <Badge colorScheme="green" size="xs">Perfect</Badge>
            <Text fontWeight="bold">{gameState.perfectHits}</Text>
          </VStack>
          <VStack gap={0}>
            <Badge colorScheme="blue" size="xs">Good</Badge>
            <Text fontWeight="bold">{gameState.goodHits}</Text>
          </VStack>
          <VStack gap={0}>
            <Badge colorScheme="yellow" size="xs">Early</Badge>
            <Text fontWeight="bold">{gameState.earlyHits}</Text>
          </VStack>
          <VStack gap={0}>
            <Badge colorScheme="orange" size="xs">Late</Badge>
            <Text fontWeight="bold">{gameState.lateHits}</Text>
          </VStack>
          <VStack gap={0}>
            <Badge colorScheme="red" size="xs">Miss</Badge>
            <Text fontWeight="bold">{gameState.missedNotes}</Text>
          </VStack>
          <VStack gap={0}>
            <Badge colorScheme="gray" size="xs">Misplaced</Badge>
            <Text fontWeight="bold">{gameState.extraNotes}</Text>
          </VStack>
        </HStack>
      </VStack>
    </Box>
  );
}
