'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Progress,
  Grid,
  Card,
  Switch,
} from '@chakra-ui/react';
import { useMidi } from '@/context/MidiContext';
import * as alphaTab from '@coderline/alphatab';
import { scoreStorage, SessionScore } from '@/lib/scoreStorage';
import { toaster } from '@/app/toaster';

interface GameState {
  isPlaying: boolean;
  isPracticeMode: boolean;
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

interface ExpectedNote {
  id: string;
  note: number;
  startTime: number;
  endTime: number;
  isHit: boolean;
  hitType?: 'perfect' | 'good' | 'early' | 'late' | 'miss';
  hitTime?: number;
}

interface RhythmGameProps {
  api?: alphaTab.AlphaTabApi;
  score?: alphaTab.model.Score;
}

const TIMING_WINDOWS = {
  perfect: 50, // ±50ms for perfect
  good: 100,   // ±100ms for good
  early: 150,  // up to 150ms early
  late: 150,   // up to 150ms late
};

const SCORE_VALUES = {
  perfect: 100,
  good: 75,
  early: 50,
  late: 50,
  miss: 0,
  extra: -25, // penalty for extra notes
};

export function RhythmGame({ api, score }: RhythmGameProps) {
  const { history } = useMidi();
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPracticeMode: false,
    score: 0,
    streak: 0,
    totalNotes: 0,
    hitNotes: 0,
    perfectHits: 0,
    goodHits: 0,
    lateHits: 0,
    earlyHits: 0,
    missedNotes: 0,
    extraNotes: 0,
    accuracy: 0,
    stars: 0,
  });

  const [expectedNotes, setExpectedNotes] = useState<ExpectedNote[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [recentScores, setRecentScores] = useState<SessionScore[]>([]);
  const gameStartTimeRef = useRef<number>(0);
  const lastProcessedMessageRef = useRef<string>('');
  const sessionStartTimeRef = useRef<number>(0);

  // Calculate accuracy and stars
  const calculateStats = useCallback((state: GameState) => {
    const totalProcessed = state.hitNotes + state.missedNotes;
    const accuracy = totalProcessed > 0 ? (state.hitNotes / totalProcessed) * 100 : 0;
    
    let stars = 0;
    if (accuracy >= 95) stars = 5;
    else if (accuracy >= 85) stars = 4;
    else if (accuracy >= 75) stars = 3;
    else if (accuracy >= 60) stars = 2;
    else if (accuracy >= 40) stars = 1;

    return { accuracy, stars };
  }, []);

  // Extract expected notes from the score
  useEffect(() => {
    if (!score || !api) return;

    const notes: ExpectedNote[] = [];
    
    try {
      // Find all percussion tracks
      const drumTracks = score.tracks.filter(track => 
        track.staves.some(stave => stave.isPercussion)
      );

      console.log('Found drum tracks:', drumTracks.length);

      drumTracks.forEach((track, trackIndex) => {
        track.staves.forEach((stave, staveIndex) => {
          if (stave.isPercussion) {
            stave.bars.forEach((bar, barIndex) => {
              bar.voices.forEach((voice, voiceIndex) => {
                voice.beats.forEach((beat, beatIndex) => {
                  if (beat.notes && beat.notes.length > 0) {
                    beat.notes.forEach((note, noteIndex) => {
                      // For percussion, check if it's a real note (has a value)
                      if (note.realValue > 0) {
                        const startTime = beat.absolutePlaybackStart || 0;
                        const noteId = `${trackIndex}-${staveIndex}-${barIndex}-${voiceIndex}-${beatIndex}-${noteIndex}`;
                        
                        notes.push({
                          id: noteId,
                          note: note.realValue || 36, // Default to kick drum if no value
                          startTime: startTime,
                          endTime: startTime + TIMING_WINDOWS.late,
                          isHit: false,
                        });
                      }
                    });
                  }
                });
              });
            });
          }
        });
      });

      console.log('Extracted expected notes:', notes.length, notes.slice(0, 3));
      setExpectedNotes(notes.sort((a, b) => a.startTime - b.startTime));
      setGameState(prev => ({ ...prev, totalNotes: notes.length }));
    } catch (error) {
      console.error('Error extracting notes from score:', error);
      // Fallback: create some dummy notes for testing
      const dummyNotes: ExpectedNote[] = Array.from({ length: 10 }, (_, i) => ({
        id: `dummy-${i}`,
        note: 36 + (i % 4), // Vary between kick, snare, etc.
        startTime: i * 1000, // Every second
        endTime: i * 1000 + TIMING_WINDOWS.late,
        isHit: false,
      }));
      setExpectedNotes(dummyNotes);
      setGameState(prev => ({ ...prev, totalNotes: dummyNotes.length }));
    }
  }, [score, api]);

  // Initialize score storage and load recent scores
  useEffect(() => {
    const initStorage = async () => {
      try {
        await scoreStorage.init();
        const recent = await scoreStorage.getRecentScores(5);
        setRecentScores(recent);
      } catch (error) {
        console.warn('Failed to initialize score storage:', error);
      }
    };

    initStorage();
  }, []);

  // Process MIDI input during gameplay
  useEffect(() => {
    if (!gameState.isPlaying || history.length === 0) return;

    const latestMessage = history[0];
    
    // Avoid processing the same message twice
    if (latestMessage.id === lastProcessedMessageRef.current) return;
    lastProcessedMessageRef.current = latestMessage.id;

    if (latestMessage.message.type === 'noteOn' && latestMessage.message.note !== undefined) {
      const hitTime = latestMessage.timestamp - gameStartTimeRef.current;
      const hitNote = latestMessage.message.note;

      console.log('Processing MIDI hit:', { hitNote, hitTime, expectedNotesCount: expectedNotes.length });

      // Find the closest expected note within timing windows
      const possibleNotes = expectedNotes.filter(note => 
        !note.isHit && 
        note.note === hitNote &&
        hitTime >= (note.startTime - TIMING_WINDOWS.early) &&
        hitTime <= (note.startTime + TIMING_WINDOWS.late)
      );

      if (possibleNotes.length > 0) {
        // Find the closest note
        const closestNote = possibleNotes.reduce((closest, current) => {
          const closestDiff = Math.abs(closest.startTime - hitTime);
          const currentDiff = Math.abs(current.startTime - hitTime);
          return currentDiff < closestDiff ? current : closest;
        });

        // Determine hit quality
        const timeDiff = Math.abs(closestNote.startTime - hitTime);
        let hitType: ExpectedNote['hitType'];
        let points = 0;

        if (timeDiff <= TIMING_WINDOWS.perfect) {
          hitType = 'perfect';
          points = SCORE_VALUES.perfect;
        } else if (timeDiff <= TIMING_WINDOWS.good) {
          hitType = 'good';
          points = SCORE_VALUES.good;
        } else if (hitTime < closestNote.startTime) {
          hitType = 'early';
          points = SCORE_VALUES.early;
        } else {
          hitType = 'late';
          points = SCORE_VALUES.late;
        }

        // Update the note
        closestNote.isHit = true;
        closestNote.hitType = hitType;
        closestNote.hitTime = hitTime;

        // Update game state
        setGameState(prev => {
          const newState = {
            ...prev,
            score: prev.score + points,
            hitNotes: prev.hitNotes + 1,
            streak: hitType === 'perfect' || hitType === 'good' ? prev.streak + 1 : 0,
            perfectHits: hitType === 'perfect' ? prev.perfectHits + 1 : prev.perfectHits,
            goodHits: hitType === 'good' ? prev.goodHits + 1 : prev.goodHits,
            earlyHits: hitType === 'early' ? prev.earlyHits + 1 : prev.earlyHits,
            lateHits: hitType === 'late' ? prev.lateHits + 1 : prev.lateHits,
          };

          const { accuracy, stars } = calculateStats(newState);
          return { ...newState, accuracy, stars };
        });

        setExpectedNotes([...expectedNotes]); // Trigger re-render
      } else {
        // Extra note (not expected)
        setGameState(prev => {
          const newState = {
            ...prev,
            score: Math.max(0, prev.score + SCORE_VALUES.extra),
            extraNotes: prev.extraNotes + 1,
            streak: 0,
          };

          const { accuracy, stars } = calculateStats(newState);
          return { ...newState, accuracy, stars };
        });
      }
    }
  }, [history, gameState.isPlaying, expectedNotes, calculateStats]);

  // Check for missed notes
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const now = currentTime;
    const missedNotes = expectedNotes.filter(note => 
      !note.isHit && now > (note.startTime + TIMING_WINDOWS.late)
    );

    if (missedNotes.length > 0) {
      missedNotes.forEach(note => {
        note.isHit = true;
        note.hitType = 'miss';
      });

      setGameState(prev => {
        const newState = {
          ...prev,
          missedNotes: prev.missedNotes + missedNotes.length,
          streak: 0,
        };

        const { accuracy, stars } = calculateStats(newState);
        return { ...newState, accuracy, stars };
      });

      setExpectedNotes([...expectedNotes]);
    }
  }, [currentTime, gameState.isPlaying, expectedNotes, calculateStats]);

  // Update current time when playing
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const interval = setInterval(() => {
      if (api?.player) {
        try {
          // Try to get current playback position
          const position = api.player.playbackRange?.startTick || 0;
          setCurrentTime(position);
        } catch (error) {
          // Fallback to elapsed time since game start
          const elapsed = Date.now() - gameStartTimeRef.current;
          setCurrentTime(elapsed);
        }
      } else {
        // Fallback timing when no player
        const elapsed = Date.now() - gameStartTimeRef.current;
        setCurrentTime(elapsed);
      }
    }, 50); // Update every 50ms

    return () => clearInterval(interval);
  }, [gameState.isPlaying, api]);

  const startGame = (practiceMode = false) => {
    if (!api || !score) return;

    gameStartTimeRef.current = Date.now();
    sessionStartTimeRef.current = Date.now();
    lastProcessedMessageRef.current = '';
    
    // Reset all notes
    expectedNotes.forEach(note => {
      note.isHit = false;
      note.hitType = undefined;
      note.hitTime = undefined;
    });

    setGameState({
      isPlaying: true,
      isPracticeMode: practiceMode,
      score: 0,
      streak: 0,
      totalNotes: expectedNotes.length,
      hitNotes: 0,
      perfectHits: 0,
      goodHits: 0,
      lateHits: 0,
      earlyHits: 0,
      missedNotes: 0,
      extraNotes: 0,
      accuracy: 0,
      stars: 0,
    });

    // Start playback
    api.player?.play();
  };

  const stopGame = async () => {
    const finalState = { ...gameState, isPlaying: false };
    setGameState(finalState);
    api?.player?.pause();

    // Save score if it's not practice mode and has some progress
    if (!finalState.isPracticeMode && (finalState.hitNotes > 0 || finalState.missedNotes > 0) && score) {
      try {
        const duration = Date.now() - sessionStartTimeRef.current;
        const maxStreak = finalState.streak; // In a real implementation, you'd track max streak separately
        
        const sessionScore: Omit<SessionScore, 'id'> = {
          songName: score.title || 'Unknown Song',
          songHash: `song_${score.title}_${score.tracks.length}`, // Simple hash for demo
          timestamp: Date.now(),
          duration,
          gameMode: 'score',
          totalScore: finalState.score,
          accuracy: finalState.accuracy,
          stars: finalState.stars,
          totalNotes: finalState.totalNotes,
          hitNotes: finalState.hitNotes,
          perfectHits: finalState.perfectHits,
          goodHits: finalState.goodHits,
          earlyHits: finalState.earlyHits,
          lateHits: finalState.lateHits,
          missedNotes: finalState.missedNotes,
          extraNotes: finalState.extraNotes,
          maxStreak,
        };

        await scoreStorage.saveScore(sessionScore);
        
        // Refresh recent scores
        const recent = await scoreStorage.getRecentScores(5);
        setRecentScores(recent);

        toaster.create({
          type: 'success',
          title: 'Score Saved!',
          description: `${finalState.accuracy.toFixed(1)}% accuracy, ${finalState.stars} stars`,
        });
      } catch (error) {
        console.warn('Failed to save score:', error);
        toaster.create({
          type: 'warning',
          title: 'Score not saved',
          description: 'Your score could not be saved to storage',
        });
      }
    }
  };

  const renderStars = (stars: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Text key={i} fontSize="xl" color={i < stars ? 'yellow.400' : 'gray.300'}>
        ⭐
      </Text>
    ));
  };

  if (!api || !score) {
    return (
      <Box p={4} bg="gray.100" borderRadius="lg">
        <Text textAlign="center" color="gray.600">
          Load a song to start the rhythm game!
        </Text>
      </Box>
    );
  }

  return (
    <Box p={4} bg="gradient-to-br from-purple-900 to-blue-900" color="white" borderRadius="lg">
      <VStack align="stretch" gap={4}>
        <HStack justify="space-between" align="center">
          <Text fontSize="xl" fontWeight="bold">🎮 Rhythm Game</Text>
          <HStack>
            <Text fontSize="sm">Practice Mode:</Text>
            <Switch.Root
              checked={gameState.isPracticeMode}
              onCheckedChange={(details) => setGameState(prev => ({ ...prev, isPracticeMode: details.checked }))}
              disabled={gameState.isPlaying}
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>
        </HStack>

        {/* Score Display */}
        <Grid templateColumns="repeat(auto-fit, minmax(120px, 1fr))" gap={3}>
          <Card.Root p={3} bg="whiteAlpha.100">
            <Text fontSize="sm" opacity={0.8}>Score</Text>
            <Text fontSize="2xl" fontWeight="bold">{gameState.score}</Text>
          </Card.Root>
          
          <Card.Root p={3} bg="whiteAlpha.100">
            <Text fontSize="sm" opacity={0.8}>Accuracy</Text>
            <Text fontSize="xl" fontWeight="bold">{gameState.accuracy.toFixed(1)}%</Text>
          </Card.Root>
          
          <Card.Root p={3} bg="whiteAlpha.100">
            <Text fontSize="sm" opacity={0.8}>Streak</Text>
            <Text fontSize="xl" fontWeight="bold">{gameState.streak}</Text>
          </Card.Root>
          
          <Card.Root p={3} bg="whiteAlpha.100">
            <Text fontSize="sm" opacity={0.8}>Stars</Text>
            <HStack>{renderStars(gameState.stars)}</HStack>
          </Card.Root>
        </Grid>

        {/* Progress */}
        {gameState.totalNotes > 0 && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm">Progress</Text>
              <Text fontSize="sm">
                {gameState.hitNotes + gameState.missedNotes} / {gameState.totalNotes}
              </Text>
            </HStack>
            <Progress.Root
              value={((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100}
              colorScheme="purple"
              size="lg"
            >
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
          </Box>
        )}

        {/* Detailed Stats */}
        <Grid templateColumns="repeat(auto-fit, minmax(100px, 1fr))" gap={2}>
          <VStack>
            <Badge colorScheme="green" size="sm">Perfect</Badge>
            <Text fontSize="lg" fontWeight="bold">{gameState.perfectHits}</Text>
          </VStack>
          <VStack>
            <Badge colorScheme="blue" size="sm">Good</Badge>
            <Text fontSize="lg" fontWeight="bold">{gameState.goodHits}</Text>
          </VStack>
          <VStack>
            <Badge colorScheme="yellow" size="sm">Early</Badge>
            <Text fontSize="lg" fontWeight="bold">{gameState.earlyHits}</Text>
          </VStack>
          <VStack>
            <Badge colorScheme="orange" size="sm">Late</Badge>
            <Text fontSize="lg" fontWeight="bold">{gameState.lateHits}</Text>
          </VStack>
          <VStack>
            <Badge colorScheme="red" size="sm">Miss</Badge>
            <Text fontSize="lg" fontWeight="bold">{gameState.missedNotes}</Text>
          </VStack>
          <VStack>
            <Badge colorScheme="gray" size="sm">Extra</Badge>
            <Text fontSize="lg" fontWeight="bold">{gameState.extraNotes}</Text>
          </VStack>
        </Grid>

        {/* Controls */}
        <HStack justify="center" gap={3}>
          {!gameState.isPlaying ? (
            <>
              <Button
                colorScheme="green"
                size="lg"
                onClick={() => startGame(false)}
                disabled={expectedNotes.length === 0}
              >
                🎯 Start Score Mode
              </Button>
              <Button
                colorScheme="blue"
                size="lg"
                onClick={() => startGame(true)}
                disabled={expectedNotes.length === 0}
              >
                🎓 Start Practice
              </Button>
            </>
          ) : (
            <Button colorScheme="red" size="lg" onClick={stopGame}>
              ⏹️ Stop Game
            </Button>
          )}
        </HStack>

        {expectedNotes.length === 0 && (
          <Text fontSize="sm" textAlign="center" opacity={0.7}>
            No drum notes found in the current score. Load a song with drum tracks to play!
          </Text>
        )}

        {/* Recent Scores */}
        {recentScores.length > 0 && (
          <Box>
            <Text fontSize="lg" fontWeight="bold" mb={3}>🏆 Recent Scores</Text>
            <VStack align="stretch" gap={2} maxH="200px" overflowY="auto">
              {recentScores.map((sessionScore) => (
                <Box
                  key={sessionScore.id}
                  p={3}
                  bg="whiteAlpha.100"
                  borderRadius="md"
                  borderLeft="4px solid"
                  borderLeftColor={sessionScore.stars >= 4 ? 'green.400' : sessionScore.stars >= 2 ? 'yellow.400' : 'red.400'}
                >
                  <HStack justify="space-between">
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" fontWeight="bold">{sessionScore.songName}</Text>
                      <Text fontSize="xs" opacity={0.8}>
                        {new Date(sessionScore.timestamp).toLocaleDateString()} • {(sessionScore.duration / 1000 / 60).toFixed(1)}m
                      </Text>
                    </VStack>
                    <VStack align="end" gap={1}>
                      <HStack gap={1}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Text key={i} fontSize="sm" color={i < sessionScore.stars ? 'yellow.400' : 'gray.400'}>
                            ⭐
                          </Text>
                        ))}
                      </HStack>
                      <Text fontSize="xs" fontWeight="bold">{sessionScore.accuracy.toFixed(1)}%</Text>
                      <Text fontSize="xs" opacity={0.7}>{sessionScore.totalScore} pts</Text>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}