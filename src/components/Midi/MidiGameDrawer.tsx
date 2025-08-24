'use client';

import React from 'react';
import {
  Drawer,
  CloseButton,
  Portal,
} from '@chakra-ui/react';
import { MidiFeedbackDisplay } from './MidiFeedbackDisplay';

export interface MidiGameDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MidiGameDrawer({ isOpen, onClose }: MidiGameDrawerProps) {
  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose} size="xl">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="800px">
            <Drawer.Header>
              <Drawer.Title>🎵 MIDI Input Feedback</Drawer.Title>
              <Drawer.Description>
                Real-time visualization of MIDI input
              </Drawer.Description>
            </Drawer.Header>
            <Drawer.Body>
              <MidiFeedbackDisplay />
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