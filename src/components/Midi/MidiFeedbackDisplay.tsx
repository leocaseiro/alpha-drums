'use client';

import React, { useEffect, useState } from 'react';
import { Box, HStack, VStack, Text, Badge } from '@chakra-ui/react';
import { useMidi } from '@/context/MidiContext';

interface DrumMapping {
  note: number;
  name: string;
  color: string;
  icon: string;
}

// Standard GM Drum Kit mapping for channel 10 (percussion)
const DRUM_MAPPINGS: DrumMapping[] = [
  { note: 36, name: 'Kick', color: 'red', icon: '🥁' },      // Bass Drum
  { note: 38, name: 'Snare', color: 'blue', icon: '🪘' },    // Snare Drum
  { note: 42, name: 'Hi-Hat', color: 'yellow', icon: '🎩' }, // Closed Hi-Hat
  { note: 46, name: 'Open HH', color: 'orange', icon: '🎩' }, // Open Hi-Hat
  { note: 49, name: 'Crash', color: 'purple', icon: '💥' },  // Crash Cymbal
  { note: 51, name: 'Ride', color: 'green', icon: '🔔' },    // Ride Cymbal
  { note: 43, name: 'Floor Tom', color: 'teal', icon: '🪘' }, // High Floor Tom
  { note: 41, name: 'Low Tom', color: 'cyan', icon: '🪘' },  // Low Floor Tom
  { note: 45, name: 'Mid Tom', color: 'pink', icon: '🪘' },  // Low Tom
  { note: 47, name: 'High Tom', color: 'gray', icon: '🪘' }, // Low-Mid Tom
  { note: 50, name: 'High Tom 2', color: 'lime', icon: '🪘' }, // High Tom
];

interface RecentNote {
  id: string;
  mapping: DrumMapping;
  velocity: number;
  timestamp: number;
}

export function MidiFeedbackDisplay() {
  const { history } = useMidi();
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);
  const [activeDrums, setActiveDrums] = useState<Set<number>>(new Set());

  // Process new MIDI messages
  useEffect(() => {
    if (history.length === 0) return;

    const latestMessage = history[0];
    if (latestMessage.message.type === 'noteOn' && latestMessage.message.note !== undefined) {
      const note = latestMessage.message.note;
      const mapping = DRUM_MAPPINGS.find(m => m.note === note);
      
      if (mapping) {
        // Add to recent notes with unique ID
        const recentNote: RecentNote = {
          id: `${latestMessage.id}-${Date.now()}`, // Ensure unique ID
          mapping,
          velocity: latestMessage.message.velocity || 0,
          timestamp: latestMessage.timestamp
        };

        setRecentNotes(prev => [recentNote, ...prev.slice(0, 9)]); // Keep last 10

        // Add to active drums
        setActiveDrums(prev => new Set(prev).add(note));

        // Remove from active drums after animation
        setTimeout(() => {
          setActiveDrums(prev => {
            const next = new Set(prev);
            next.delete(note);
            return next;
          });
        }, 300);
      }
    }
  }, [history]);

  return (
    <Box p={4} bg="gray.900" color="white" borderRadius="lg" minH="200px">
      <VStack align="stretch" gap={4}>
        <Text fontSize="lg" fontWeight="bold" textAlign="center">
          🎵 MIDI Input Feedback
        </Text>

        {/* Active Drums Display */}
        <Box>
          <Text fontSize="sm" mb={2} opacity={0.8}>
            Drum Kit:
          </Text>
          <HStack wrap="wrap" gap={2}>
            {DRUM_MAPPINGS.map((drum) => {
              const isActive = activeDrums.has(drum.note);
              return (
                <Box
                  key={drum.note}
                  p={2}
                  borderRadius="md"
                  bg={isActive ? `${drum.color}.500` : 'gray.700'}
                  transition="all 0.2s"
                  transform={isActive ? 'scale(1.1)' : 'scale(1)'}
                  boxShadow={isActive ? `0 0 10px var(--chakra-colors-${drum.color}-400)` : 'none'}
                  minW="60px"
                  textAlign="center"
                >
                  <Text fontSize="xl">{drum.icon}</Text>
                  <Text fontSize="xs" fontWeight="bold">
                    {drum.name}
                  </Text>
                  <Text fontSize="xs" opacity={0.7}>
                    {drum.note}
                  </Text>
                </Box>
              );
            })}
          </HStack>
        </Box>

        {/* Recent Notes */}
        <Box>
          <Text fontSize="sm" mb={2} opacity={0.8}>
            Recent Notes:
          </Text>
          {recentNotes.length === 0 ? (
            <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>
              Play some notes on your MIDI device to see them here!
            </Text>
          ) : (
            <VStack align="stretch" gap={1} maxH="120px" overflowY="auto">
              {recentNotes.map((note) => (
                <HStack
                  key={note.id}
                  justify="space-between"
                  p={2}
                  bg="gray.800"
                  borderRadius="md"
                  borderLeft="4px solid"
                  borderLeftColor={`${note.mapping.color}.400`}
                >
                  <HStack gap={2}>
                    <Text fontSize="lg">{note.mapping.icon}</Text>
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" fontWeight="bold">
                        {note.mapping.name}
                      </Text>
                      <Text fontSize="xs" opacity={0.7}>
                        Note {note.mapping.note}
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack align="end" gap={0}>
                    <Badge
                      colorScheme={note.velocity > 100 ? 'red' : note.velocity > 60 ? 'orange' : 'green'}
                      size="sm"
                    >
                      Vel: {note.velocity}
                    </Badge>
                    <Text fontSize="xs" opacity={0.5}>
                      {new Date(note.timestamp).toLocaleTimeString()}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
}