'use client';

import React from 'react';
import {
  Drawer,
  CloseButton,
  Portal,
  Tabs,
} from '@chakra-ui/react';
import * as alphaTab from '@coderline/alphatab';
import { MidiFeedbackDisplay } from './MidiFeedbackDisplay';
import { RhythmGame } from './RhythmGame';

export interface MidiGameDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  api?: alphaTab.AlphaTabApi;
  score?: alphaTab.model.Score;
}

export function MidiGameDrawer({ isOpen, onClose, api, score }: MidiGameDrawerProps) {
  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose} size="xl">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="800px">
            <Drawer.Header>
              <Drawer.Title>🎵 MIDI Game & Feedback</Drawer.Title>
              <Drawer.Description>
                Practice and play along with MIDI input
              </Drawer.Description>
            </Drawer.Header>
            <Drawer.Body>
              <Tabs.Root defaultValue="feedback" size="lg">
                <Tabs.List mb={4}>
                  <Tabs.Trigger value="feedback">
                    🎹 Input Feedback
                  </Tabs.Trigger>
                  <Tabs.Trigger value="game">
                    🎮 Rhythm Game
                  </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="feedback">
                  <MidiFeedbackDisplay />
                </Tabs.Content>

                <Tabs.Content value="game">
                  <RhythmGame api={api} score={score} />
                </Tabs.Content>
              </Tabs.Root>
            </Drawer.Body>
            <Drawer.Footer>
              {/* Footer content can be added here if needed */}
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