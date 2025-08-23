'use client';

import React, { useState } from 'react';
import {
  Drawer,
  VStack,
  HStack,
  Text,
  Button,
  CloseButton,
  Portal,
  Badge,
  IconButton,
  Box,
  Code,
  Input,
} from '@chakra-ui/react';
import { useMidi, MidiHistory } from '@/context/MidiContext';

export interface MidiHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function MidiMessageDisplay({ message }: { message: MidiHistory['message'] }) {
  const { type, note, velocity, channel, data } = message;
  
  const getTypeColor = () => {
    switch (type) {
      case 'noteOn': return 'green';
      case 'noteOff': return 'red';
      case 'controlChange': return 'blue';
      default: return 'gray';
    }
  };

  const getNoteName = (note?: number) => {
    if (note === undefined) return '';
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(note / 12) - 1;
    const noteName = noteNames[note % 12];
    return `${noteName}${octave} (${note})`;
  };

  return (
    <VStack align="stretch" gap={1}>
      <HStack justify="space-between">
        <Badge colorScheme={getTypeColor()} variant="subtle">
          {type}
        </Badge>
        {channel !== undefined && (
          <Text fontSize="xs" color="gray.500">Ch {channel + 1}</Text>
        )}
      </HStack>
      
      {note !== undefined && (
        <HStack justify="space-between">
          <Text fontSize="xs">Note:</Text>
          <Text fontSize="xs" fontFamily="mono">{getNoteName(note)}</Text>
        </HStack>
      )}
      
      {velocity !== undefined && (
        <HStack justify="space-between">
          <Text fontSize="xs">Velocity:</Text>
          <Text fontSize="xs" fontFamily="mono">{velocity}</Text>
        </HStack>
      )}
      
      <HStack justify="space-between">
        <Text fontSize="xs">Raw:</Text>
        <Code fontSize="xs">[{Array.from(data).join(', ')}]</Code>
      </HStack>
    </VStack>
  );
}

export function MidiHistoryDrawer({ isOpen, onClose }: MidiHistoryDrawerProps) {
  const { history, clearHistory, maxHistorySize, setMaxHistorySize } = useMidi();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(entry => {
    const matchesType = filterType === 'all' || entry.message.type === filterType;
    const matchesSearch = searchTerm === '' || 
      entry.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.message.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="600px">
            <Drawer.Header>
              <HStack justify="space-between" w="full">
                <Drawer.Title>MIDI History</Drawer.Title>
                <HStack>
                  <Badge variant="outline">
                    {filteredHistory.length} / {history.length}
                  </Badge>
                  <IconButton
                    aria-label="Clear history"
                    size="sm"
                    variant="outline"
                    colorScheme="red"
                    onClick={clearHistory}
                  >
                    🗑️
                  </IconButton>
                </HStack>
              </HStack>
            </Drawer.Header>
            <Drawer.Body>
              <VStack align="stretch" gap={4}>
                {/* Controls */}
                <VStack align="stretch" gap={3}>
                  <HStack gap={2}>
                    <Text fontSize="sm" fontWeight="medium" flexShrink={0}>Filter:</Text>
                    <HStack gap={1}>
                      {['all', 'noteOn', 'noteOff', 'controlChange'].map(type => (
                        <Button
                          key={type}
                          size="xs"
                          variant={filterType === type ? 'solid' : 'outline'}
                          onClick={() => setFilterType(type)}
                        >
                          {type === 'all' ? 'All' : type}
                        </Button>
                      ))}
                    </HStack>
                  </HStack>
                  
                  <HStack gap={2}>
                    <Text fontSize="sm" fontWeight="medium" flexShrink={0}>Search:</Text>
                    <Input
                      size="sm"
                      placeholder="Device name or message type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </HStack>

                  <HStack gap={2}>
                    <Text fontSize="sm" fontWeight="medium" flexShrink={0}>Max entries:</Text>
                    <Input
                      size="sm"
                      type="number"
                      min={10}
                      max={10000}
                      value={maxHistorySize}
                      onChange={(e) => setMaxHistorySize(Number(e.target.value) || 1000)}
                      w="100px"
                    />
                  </HStack>
                </VStack>

                {/* History List */}
                <VStack align="stretch" gap={2} maxH="500px" overflowY="auto">
                  {filteredHistory.length === 0 ? (
                    <Text fontSize="sm" color="gray.500" textAlign="center" p={4}>
                      {history.length === 0 ? 'No MIDI messages received yet' : 'No messages match your filter'}
                    </Text>
                  ) : (
                    filteredHistory.map((entry) => (
                      <Box
                        key={entry.id}
                        borderWidth="1px"
                        borderRadius="md"
                        p={3}
                        bg="gray.50"
                        borderColor="gray.200"
                      >
                        <VStack align="stretch" gap={2}>
                          <HStack justify="space-between">
                            <Text fontSize="sm" fontWeight="medium">{entry.deviceName}</Text>
                            <Text fontSize="xs" color="gray.500" fontFamily="mono">
                              {formatTime(entry.timestamp)}
                            </Text>
                          </HStack>
                          <MidiMessageDisplay message={entry.message} />
                        </VStack>
                      </Box>
                    ))
                  )}
                </VStack>

                {history.length > 0 && (
                  <Text fontSize="xs" color="gray.500" textAlign="center">
                    History is limited to {maxHistorySize} entries. Older entries are automatically removed.
                  </Text>
                )}
              </VStack>
            </Drawer.Body>
            <Drawer.Footer>
              <Button onClick={onClose}>Close</Button>
            </Drawer.Footer>
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}