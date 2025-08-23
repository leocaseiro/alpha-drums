'use client';

import React from 'react';
import {
  Drawer,
  VStack,
  HStack,
  Text,
  Switch,
  Button,
  CloseButton,
  Portal,
  Badge,
  IconButton,
  Alert,
  Box,
} from '@chakra-ui/react';
import { useMidi } from '@/context/MidiContext';
import { toaster } from '@/app/toaster';

export interface MidiSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MidiSettingsDrawer({ isOpen, onClose }: MidiSettingsDrawerProps) {
  const {
    inputDevices,
    outputDevices,
    connectedInputs,
    connectedOutputs,
    connectInput,
    disconnectInput,
    connectOutput,
    disconnectOutput,
    refreshInputs,
    refreshOutputs,
    settings,
    updateSettings,
    isSupported,
    isLoading,
    error
  } = useMidi();

  const handleInputToggle = (deviceId: string, connected: boolean) => {
    if (connected) {
      const success = disconnectInput(deviceId);
      if (success) {
        updateSettings({
          selectedInputs: new Set([...settings.selectedInputs].filter(id => id !== deviceId))
        });
        toaster.create({
          type: 'info',
          title: 'MIDI Input',
          description: 'Disconnected from input device'
        });
      }
    } else {
      const success = connectInput(deviceId);
      if (success) {
        updateSettings({
          selectedInputs: new Set([...settings.selectedInputs, deviceId])
        });
        toaster.create({
          type: 'success',
          title: 'MIDI Input',
          description: 'Connected to input device'
        });
      }
    }
  };

  const handleOutputToggle = (deviceId: string, connected: boolean) => {
    if (connected) {
      const success = disconnectOutput(deviceId);
      if (success) {
        updateSettings({
          selectedOutputs: new Set([...settings.selectedOutputs].filter(id => id !== deviceId))
        });
        toaster.create({
          type: 'info',
          title: 'MIDI Output',
          description: 'Disconnected from output device'
        });
      }
    } else {
      const success = connectOutput(deviceId);
      if (success) {
        updateSettings({
          selectedOutputs: new Set([...settings.selectedOutputs, deviceId])
        });
        toaster.create({
          type: 'success',
          title: 'MIDI Output',
          description: 'Connected to output device'
        });
      }
    }
  };

  const handleRefresh = () => {
    refreshInputs();
    refreshOutputs();
    toaster.create({
      type: 'info',
      title: 'MIDI Devices',
      description: 'Refreshed device list'
    });
  };

  if (!isSupported) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={onClose}>
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>MIDI Settings</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                <Box p={4} bg="red.50" borderRadius="md" borderWidth="1px" borderColor="red.200">
                  <Text fontWeight="bold" color="red.700">MIDI Not Supported</Text>
                  <Text color="red.600" fontSize="sm" mt={1}>
                    Your browser doesn't support the Web MIDI API. Please use a modern browser like Chrome, Edge, or Opera.
                  </Text>
                </Box>
              </Drawer.Body>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    );
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="600px">
            <Drawer.Header>
              <HStack justify="space-between" w="full">
                <Drawer.Title>MIDI Settings</Drawer.Title>
                <IconButton
                  aria-label="Refresh devices"
                  size="sm"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  🔄
                </IconButton>
              </HStack>
            </Drawer.Header>
            <Drawer.Body>
              <VStack align="stretch" gap={6}>
                {error && (
                  <Box p={4} bg="red.50" borderRadius="md" borderWidth="1px" borderColor="red.200">
                    <Text fontWeight="bold" color="red.700">MIDI Error</Text>
                    <Text color="red.600" fontSize="sm" mt={1}>{error}</Text>
                  </Box>
                )}

                {/* General Settings */}
                <VStack align="stretch" gap={3}>
                  <Text fontWeight="semibold" fontSize="lg">General Settings</Text>
                  
                  <HStack justify="space-between">
                    <Text fontSize="sm">Enable MIDI Logging</Text>
                    <Switch.Root
                      checked={settings.enableLogging}
                      onCheckedChange={(details) => updateSettings({ enableLogging: details.checked })}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>

                  <HStack justify="space-between">
                    <Text fontSize="sm">Auto-connect Inputs</Text>
                    <Switch.Root
                      checked={settings.autoConnectInputs}
                      onCheckedChange={(details) => updateSettings({ autoConnectInputs: details.checked })}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>

                  <HStack justify="space-between">
                    <Text fontSize="sm">Auto-connect Outputs</Text>
                    <Switch.Root
                      checked={settings.autoConnectOutputs}
                      onCheckedChange={(details) => updateSettings({ autoConnectOutputs: details.checked })}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>
                </VStack>

                {/* Input Devices */}
                <VStack align="stretch" gap={3}>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold" fontSize="lg">Input Devices</Text>
                    <Badge variant="subtle" colorScheme="blue">
                      {connectedInputs.size} connected
                    </Badge>
                  </HStack>
                  
                  {inputDevices.length === 0 ? (
                    <Text fontSize="sm" color="gray.500">No MIDI input devices found</Text>
                  ) : (
                    <VStack align="stretch" gap={2}>
                      {inputDevices.map((device) => {
                        const isConnected = connectedInputs.has(device.id);
                        return (
                          <Box
                            key={device.id}
                            borderWidth="1px"
                            borderRadius="md"
                            p={3}
                            bg={isConnected ? 'green.50' : 'gray.50'}
                            borderColor={isConnected ? 'green.200' : 'gray.200'}
                          >
                            <HStack justify="space-between">
                              <VStack align="start" gap={1}>
                                <Text fontWeight="medium" fontSize="sm">{device.name}</Text>
                                <Text fontSize="xs" color="gray.600">
                                  {device.manufacturer} • {device.state}
                                </Text>
                              </VStack>
                              <Switch.Root
                                checked={isConnected}
                                onCheckedChange={() => handleInputToggle(device.id, isConnected)}
                                disabled={device.state !== 'connected'}
                              >
                                <Switch.HiddenInput />
                                <Switch.Control>
                                  <Switch.Thumb />
                                </Switch.Control>
                              </Switch.Root>
                            </HStack>
                          </Box>
                        );
                      })}
                    </VStack>
                  )}
                </VStack>

                {/* Output Devices */}
                <VStack align="stretch" gap={3}>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold" fontSize="lg">Output Devices</Text>
                    <Badge variant="subtle" colorScheme="purple">
                      {connectedOutputs.size} connected
                    </Badge>
                  </HStack>
                  
                  {outputDevices.length === 0 ? (
                    <Text fontSize="sm" color="gray.500">No MIDI output devices found</Text>
                  ) : (
                    <VStack align="stretch" gap={2}>
                      {outputDevices.map((device) => {
                        const isConnected = connectedOutputs.has(device.id);
                        return (
                          <Box
                            key={device.id}
                            borderWidth="1px"
                            borderRadius="md"
                            p={3}
                            bg={isConnected ? 'purple.50' : 'gray.50'}
                            borderColor={isConnected ? 'purple.200' : 'gray.200'}
                          >
                            <HStack justify="space-between">
                              <VStack align="start" gap={1}>
                                <Text fontWeight="medium" fontSize="sm">{device.name}</Text>
                                <Text fontSize="xs" color="gray.600">
                                  {device.manufacturer} • {device.state}
                                </Text>
                              </VStack>
                              <Switch.Root
                                checked={isConnected}
                                onCheckedChange={() => handleOutputToggle(device.id, isConnected)}
                                disabled={device.state !== 'connected'}
                              >
                                <Switch.HiddenInput />
                                <Switch.Control>
                                  <Switch.Thumb />
                                </Switch.Control>
                              </Switch.Root>
                            </HStack>
                          </Box>
                        );
                      })}
                    </VStack>
                  )}
                </VStack>
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