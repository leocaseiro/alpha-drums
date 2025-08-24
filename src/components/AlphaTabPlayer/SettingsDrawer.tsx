'use client';

import React from 'react';
import * as alphaTab from '@coderline/alphatab';
import {
  Button,
  Drawer,
  VStack,
  HStack,
  Text,
  CloseButton,
  Portal,
  Tabs,
  Accordion,
  Box,
  IconButton,
} from '@chakra-ui/react';
import { buildSettingsGroups, SettingsContextProps } from './settings-config';
import { SettingsControl } from './SettingsControls';

export interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  api: alphaTab.AlphaTabApi | undefined;
}

export function SettingsDrawer({ isOpen, onClose, api }: SettingsDrawerProps) {
  const [settingsUpdated, setSettingsUpdated] = React.useState(0);
  
  const context: SettingsContextProps = React.useMemo(() => ({
    api: api!,
    onSettingsUpdated: () => setSettingsUpdated(prev => prev + 1)
  }), [api]);

  const settingsGroups = React.useMemo(() => buildSettingsGroups(), []);

  // Group settings by category
  const categoryGroups = React.useMemo(() => {
    const groups: Record<string, typeof settingsGroups> = {};
    settingsGroups.forEach(group => {
      const category = group.title.split(' ▸ ')[0];
      if (!groups[category]) groups[category] = [];
      groups[category].push(group);
    });
    return groups;
  }, [settingsGroups]);

  const resetToDefaults = () => {
    if (!api) return;
    
    // Reset to default settings
    const defaultSettings = new alphaTab.Settings();
    Object.assign(api.settings, defaultSettings);
    api.updateSettings();
    api.render();
    setSettingsUpdated(prev => prev + 1);
  };

  if (!api) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={onClose}>
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>Settings</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                <Text>No API available</Text>
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
          <Drawer.Content maxW="800px">
            <Drawer.Header>
              <HStack justify="space-between" w="full">
                <Drawer.Title>Settings</Drawer.Title>
                <IconButton
                  aria-label="Reset to defaults"
                  size="sm"
                  variant="outline"
                  onClick={resetToDefaults}
                >
                  🔄
                </IconButton>
              </HStack>
            </Drawer.Header>
            <Drawer.Body>
              <Tabs.Root defaultValue="Display" orientation="vertical">
                <HStack align="start" gap={4} h="600px">
                  <Tabs.List w="200px" flexShrink={0}>
                    {Object.keys(categoryGroups).map((category) => (
                      <Tabs.Trigger key={category} value={category} w="full" justifyContent="start">
                        {category}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>

                  <Box flex="1" overflowY="auto" h="full">
                    {Object.entries(categoryGroups).map(([category, groups]) => (
                      <Tabs.Content key={category} value={category}>
                        <VStack align="stretch" gap={4}>
                          {groups.map((group) => (
                            <Accordion.Root key={group.title} collapsible defaultValue={[group.title]}>
                              <Accordion.Item value={group.title}>
                                <Accordion.ItemTrigger>
                                  <Text fontWeight="semibold" fontSize="md">
                                    {group.title.includes(' ▸ ') ? group.title.split(' ▸ ')[1] : group.title}
                                  </Text>
                                  <Accordion.ItemIndicator />
                                </Accordion.ItemTrigger>
                                <Accordion.ItemContent>
                                  <VStack align="stretch" gap={3} p={2}>
                                    {group.settings.map((setting, index) => (
                                      <SettingsControl
                                        key={`${group.title}-${index}`}
                                        setting={setting}
                                        context={context}
                                      />
                                    ))}
                                  </VStack>
                                </Accordion.ItemContent>
                              </Accordion.Item>
                            </Accordion.Root>
                          ))}
                        </VStack>
                      </Tabs.Content>
                    ))}
                  </Box>
                </HStack>
              </Tabs.Root>
            </Drawer.Body>
            <Drawer.Footer>
              <HStack>
                <Button variant="outline" onClick={onClose}>Close</Button>
                <Button onClick={resetToDefaults}>Reset All</Button>
              </HStack>
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
