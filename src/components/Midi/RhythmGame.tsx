'use client';

import React, { useState, useEffect, useCallback, useRef, useImperativeHandle } from 'react';
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
import { debugLog } from '@/lib/debug';

interface GameState {
  isPlaying: boolean;
  isPracticeMode: boolean;
  isSessionActive: boolean; // Track if we have an active game session (separate from playback)
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
  onGameStateChange?: (state: GameState) => void;
  practiceMode?: boolean;
  hideUI?: boolean;
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

export const RhythmGame = React.forwardRef<
  { startGame: (practice: boolean) => void; stopGame: () => void },
  RhythmGameProps
>(({ api, score, onGameStateChange, practiceMode = false, hideUI = false }, ref) => {
  const { history } = useMidi();
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPracticeMode: false,
    isSessionActive: false,
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

  // Notify parent of game state changes
  useEffect(() => {
    onGameStateChange?.(gameState);
  }, [gameState, onGameStateChange]);

  // Update practice mode when prop changes
  useEffect(() => {
    setGameState(prev => ({ ...prev, isPracticeMode: practiceMode }));
  }, [practiceMode]);

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
      console.log('📊 FULL SCORE ANALYSIS:');
      console.log('Score object:', score);
      console.log('Score tracks:', score.tracks);
      
      // Detailed track analysis
      score.tracks.forEach((track, trackIndex) => {
        console.log(`\n🎵 Track ${trackIndex}: "${track.name}"`, {
          index: track.index,
          name: track.name,
          staves: track.staves.length,
          stavesInfo: track.staves.map((stave, staveIndex) => ({
            staveIndex,
            isPercussion: stave.isPercussion,
            bars: stave.bars.length,
            firstBarInfo: stave.bars[0] ? {
              voices: stave.bars[0].voices.length,
              firstVoiceBeats: stave.bars[0].voices[0]?.beats.length || 0,
              firstBeatNotes: stave.bars[0].voices[0]?.beats[0]?.notes.length || 0
            } : 'No bars'
          }))
        });

        // If this looks like a drum track, dive deeper
        const hasPercussion = track.staves.some(s => s.isPercussion);
        if (hasPercussion) {
          console.log(`🥁 DRUM TRACK FOUND: "${track.name}"`);
          
          track.staves.forEach((stave, staveIndex) => {
            if (stave.isPercussion) {
              console.log(`  📋 Percussion Stave ${staveIndex}:`, {
                bars: stave.bars.length,
                barDetails: stave.bars.slice(0, 3).map((bar, barIndex) => ({
                  barIndex,
                  voices: bar.voices.length,
                  voiceDetails: bar.voices.map((voice, voiceIndex) => ({
                    voiceIndex,
                    beats: voice.beats.length,
                    beatDetails: voice.beats.slice(0, 3).map((beat, beatIndex) => ({
                      beatIndex,
                      notes: beat.notes.length,
                      absolutePlaybackStart: beat.absolutePlaybackStart,
                      playbackDuration: beat.playbackDuration,
                      noteDetails: beat.notes.map(note => ({
                        realValue: note.realValue,
                        fret: note.fret,
                        string: note.string,
                        isRest: note.isRest,
                        isDead: note.isDead
                      }))
                    }))
                  }))
                }))
              });
            }
          });
        }
      });

      // Find all percussion tracks
      const drumTracks = score.tracks.filter(track => 
        track.staves.some(stave => stave.isPercussion)
      );

      console.log('\n🔍 PERCUSSION DETECTION RESULTS:', {
        totalTracks: score.tracks.length,
        drumTracksFound: drumTracks.length,
        drumTrackNames: drumTracks.map(t => t.name)
      });

      console.log('\n🎵 STARTING NOTE EXTRACTION...');
      
      drumTracks.forEach((track, trackIndex) => {
        console.log(`\n📋 Processing drum track ${trackIndex}: "${track.name}"`);
        
        track.staves.forEach((stave, staveIndex) => {
          if (stave.isPercussion) {
            console.log(`  🎼 Processing percussion stave ${staveIndex} with ${stave.bars.length} bars`);
            
            stave.bars.forEach((bar, barIndex) => {
              if (barIndex < 5) { // Only log first 5 bars to avoid spam
                console.log(`    📊 Bar ${barIndex}: ${bar.voices.length} voices`);
              }
              
              bar.voices.forEach((voice, voiceIndex) => {
                if (barIndex < 5) {
                  console.log(`      🗣️ Voice ${voiceIndex}: ${voice.beats.length} beats`);
                }
                
                voice.beats.forEach((beat, beatIndex) => {
                  if (beat.notes && beat.notes.length > 0) {
                    if (barIndex < 3 && beatIndex < 3) { // Only log first few for debugging
                      console.log(`        🎵 Beat ${beatIndex}: ${beat.notes.length} notes, playbackStart: ${beat.absolutePlaybackStart}`);
                    }
                    
                    beat.notes.forEach((note, noteIndex) => {
                      if (barIndex < 3 && beatIndex < 3) {
                        console.log(`          🎶 Note ${noteIndex}:`, {
                          realValue: note.realValue,
                          fret: note.fret,
                          string: note.string,
                          isRest: note.isRest
                        });
                      }
                      
                      // For percussion, check if it's a real note (has a value)
                      if (note.realValue > 0) {
                        // Convert AlphaTab ticks to milliseconds using tempo
                        // AlphaTab uses ticks, need to convert to real time
                        const startTimeMs = (beat.absolutePlaybackStart || 0) / 1000; // Convert to seconds
                        const noteId = `${trackIndex}-${staveIndex}-${barIndex}-${voiceIndex}-${beatIndex}-${noteIndex}`;
                        
                        // Map guitar pro percussion to MIDI notes (GM Drum Kit)
                        let midiNote = note.realValue;
                        
                        // Common guitar pro to MIDI percussion mapping
                        const percussionMap: { [key: number]: number } = {
                          // Guitar Pro -> MIDI Note
                          43: 36, // Bass drum -> MIDI 36 (Kick)
                          38: 38, // Snare -> MIDI 38 (Snare)
                          42: 42, // Closed Hi-hat -> MIDI 42
                          46: 46, // Open Hi-hat -> MIDI 46
                          49: 49, // Crash -> MIDI 49
                          51: 51, // Ride -> MIDI 51
                          45: 41, // Low tom -> MIDI 41
                          48: 43, // High tom -> MIDI 43
                          50: 45, // High tom 2 -> MIDI 45
                        };
                        
                        // Use mapping if available, otherwise use original value
                        midiNote = percussionMap[note.realValue] || note.realValue;
                        
                        const expectedNote = {
                          id: noteId,
                          note: midiNote,
                          startTime: startTimeMs,
                          endTime: startTimeMs + TIMING_WINDOWS.late / 1000,
                          isHit: false,
                        };
                        
                        notes.push(expectedNote);
                        
                        if (notes.length <= 5) { // Log first few extracted notes
                          console.log(`          ✅ EXTRACTED NOTE: originalValue=${note.realValue} -> midiNote=${midiNote}, startTime=${startTimeMs.toFixed(3)}s`);
                        }
                      }
                    });
                  }
                });
              });
            });
          }
        });
      });

      console.log('🎼 Note Extraction Results:', {
        extractedNotes: notes.length,
        sampleNotes: notes.slice(0, 5).map(n => ({ 
          note: n.note, 
          startTime: n.startTime.toFixed(3),
          id: n.id 
        })),
        drumTracksProcessed: drumTracks.length
      });
    } catch (error) {
      console.error('Error extracting notes from score:', error);
    }

    // If no notes found, create dummy notes for testing
    if (notes.length === 0) {
      console.log('⚠️ No drum notes found, creating dummy notes for testing');
      const dummyNotes: ExpectedNote[] = Array.from({ length: 10 }, (_, i) => ({
        id: `dummy-${i}`,
        note: 36 + (i % 4), // Vary between kick(36), snare(38), hihat(42), crash(49)
        startTime: i * 2, // Every 2 seconds
        endTime: i * 2 + TIMING_WINDOWS.late / 1000,
        isHit: false,
      }));
      setExpectedNotes(dummyNotes);
      setGameState(prev => ({ ...prev, totalNotes: dummyNotes.length }));
      
      console.log('🧪 Created dummy notes:', dummyNotes.slice(0, 3));
    } else {
      setExpectedNotes(notes.sort((a, b) => a.startTime - b.startTime));
      setGameState(prev => ({ ...prev, totalNotes: notes.length }));
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
    // Always log MIDI messages to debug
    if (history.length > 0) {
      console.log('🎹 MIDI message received:', {
        historyLength: history.length,
        latestMessage: history[0],
        gameIsPlaying: gameState.isPlaying,
        isSessionActive: gameState.isSessionActive
      });
    }
    
    if (!gameState.isPlaying || history.length === 0) return;

    const latestMessage = history[0];
    
    // Avoid processing the same message twice
    if (latestMessage.id === lastProcessedMessageRef.current) return;
    lastProcessedMessageRef.current = latestMessage.id;

    if (latestMessage.message.type === 'noteOn' && latestMessage.message.note !== undefined) {
      const hitTime = (latestMessage.timestamp - gameStartTimeRef.current) / 1000; // Convert to seconds
      const hitNote = latestMessage.message.note;

      debugLog.log('Processing MIDI hit:', { 
        hitNote, 
        hitTime: hitTime.toFixed(3), 
        expectedNotesCount: expectedNotes.length,
        gameIsPlaying: gameState.isPlaying,
        gameStartTime: gameStartTimeRef.current
      });

      // Find possible matching notes first
      const possibleNotes = expectedNotes.filter(note => 
        !note.isHit && 
        note.note === hitNote &&
        hitTime >= (note.startTime - TIMING_WINDOWS.early / 1000) &&
        hitTime <= (note.startTime + TIMING_WINDOWS.late / 1000)
      );

      // Proper note matching and timing detection
      if (gameState.isPlaying) {
        console.log('🎮 Processing hit during gameplay:', { hitNote, hitTime });
        let hitProcessed = false;
        
        // Check if this note matches any expected notes within timing windows
        if (possibleNotes.length > 0) {
          // Find the closest expected note
          const closestNote = possibleNotes.reduce((closest, current) => {
            const closestDiff = Math.abs(closest.startTime - hitTime);
            const currentDiff = Math.abs(current.startTime - hitTime);
            return currentDiff < closestDiff ? current : closest;
          });

          // Determine hit quality based on timing accuracy
          const timeDiff = Math.abs(closestNote.startTime - hitTime);
          let hitType: ExpectedNote['hitType'];
          let points = 0;

          if (timeDiff <= TIMING_WINDOWS.perfect / 1000) {
            hitType = 'perfect';
            points = SCORE_VALUES.perfect;
          } else if (timeDiff <= TIMING_WINDOWS.good / 1000) {
            hitType = 'good';
            points = SCORE_VALUES.good;
          } else if (hitTime < closestNote.startTime) {
            hitType = 'early';
            points = SCORE_VALUES.early;
          } else {
            hitType = 'late';
            points = SCORE_VALUES.late;
          }

          // Mark the note as hit
          closestNote.isHit = true;
          closestNote.hitType = hitType;
          closestNote.hitTime = hitTime;

          // Update game state
          setGameState(prev => {
            const newState = {
              ...prev,
              score: prev.score + points,
              hitNotes: prev.hitNotes + 1,
              perfectHits: hitType === 'perfect' ? prev.perfectHits + 1 : prev.perfectHits,
              goodHits: hitType === 'good' ? prev.goodHits + 1 : prev.goodHits,
              earlyHits: hitType === 'early' ? prev.earlyHits + 1 : prev.earlyHits,
              lateHits: hitType === 'late' ? prev.lateHits + 1 : prev.lateHits,
              streak: hitType === 'perfect' || hitType === 'good' ? prev.streak + 1 : 0,
            };

            const { accuracy, stars } = calculateStats(newState);
            return { ...newState, accuracy, stars };
          });

          debugLog.log('✅ CORRECT NOTE!', { 
            hitNote, 
            expectedNote: closestNote.note, 
            hitType, 
            points, 
            timeDiff: timeDiff.toFixed(3) + 's',
            timing: `Expected: ${closestNote.startTime.toFixed(3)}s, Hit: ${hitTime.toFixed(3)}s`
          });

          hitProcessed = true;
        }

        // If no matching note found, still award some points for debugging
        if (!hitProcessed) {
          // For debugging: award points for any MIDI input
          setGameState(prev => {
            const newState = {
              ...prev,
              score: prev.score + 25, // Basic points for any hit
              extraNotes: prev.extraNotes + 1,
              hitNotes: prev.hitNotes + 1, // Count as hit for debugging
            };

            const { accuracy, stars } = calculateStats(newState);
            return { ...newState, accuracy, stars };
          });

          console.log('🔧 DEBUG: Basic scoring applied', { 
            hitNote, 
            points: 25,
            newScore: gameState.score + 25
          });
        }
      }
    }
  }, [history, gameState.isPlaying, expectedNotes, calculateStats]);

  // Check for missed notes (notes that passed their timing window without being hit)
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const currentGameTime = (Date.now() - gameStartTimeRef.current) / 1000;
    const missedNotes = expectedNotes.filter(note => 
      !note.isHit && currentGameTime > (note.startTime + TIMING_WINDOWS.late / 1000)
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
          streak: 0, // Break streak on missed notes
        };

        const { accuracy, stars } = calculateStats(newState);
        return { ...newState, accuracy, stars };
      });

      debugLog.log('😞 MISSED NOTES!', { 
        count: missedNotes.length, 
        currentGameTime: currentGameTime.toFixed(3) + 's',
        missedNotes: missedNotes.map(n => ({ note: n.note, expectedTime: n.startTime.toFixed(3) + 's' }))
      });

      setExpectedNotes([...expectedNotes]);
    }
  }, [currentTime, gameState.isPlaying, expectedNotes, calculateStats, gameStartTimeRef]);

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
    if (!api || !score) {
      debugLog.warn('Cannot start game: missing API or score');
      return;
    }

    gameStartTimeRef.current = Date.now();
    sessionStartTimeRef.current = Date.now();
    lastProcessedMessageRef.current = '';
    
    debugLog.log('🎮 Starting rhythm game:', {
      practiceMode,
      expectedNotes: expectedNotes.length,
      gameStartTime: gameStartTimeRef.current
    });
    
    // Reset all notes
    expectedNotes.forEach(note => {
      note.isHit = false;
      note.hitType = undefined;
      note.hitTime = undefined;
    });

    const newGameState = {
      isPlaying: true,
      isPracticeMode: practiceMode,
      isSessionActive: true,
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
    };

    setGameState(newGameState);
    debugLog.log('Game state set to playing:', newGameState);

    // Start playback
    api.player?.play();
  };

  const stopGame = async () => {
    // Only pause playback, keep session active so score stays visible
    setGameState(prev => ({ ...prev, isPlaying: false }));
    api?.player?.pause();
    
    debugLog.log('🎮 Game paused, keeping session active');
  };

  const endGameSession = async () => {
    const finalState = { ...gameState, isPlaying: false, isSessionActive: false };
    setGameState(finalState);

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

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    startGame: (practice: boolean = false) => {
      startGame(practice);
    },
    stopGame: () => {
      stopGame();
    }
  }), []);

  if (!api || !score) {
    if (hideUI) return null;
    return (
      <Box p={4} bg="gray.100" borderRadius="lg">
        <Text textAlign="center" color="gray.600">
          Load a song to start the rhythm game!
        </Text>
      </Box>
    );
  }

  if (hideUI) {
    // Return null for hidden mode - the game logic still runs via effects
    return null;
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
});

RhythmGame.displayName = 'RhythmGame';