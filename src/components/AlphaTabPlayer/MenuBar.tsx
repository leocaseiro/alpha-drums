'use client';

import React from 'react';
import { HStack, Button, Text, MenuRoot, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from '@chakra-ui/react';
import { useI18n } from '@/app/i18n';
import * as alphaTab from '@coderline/alphatab';
import I18nSwitcher from '@/app/I18nSwitcher';

export interface MenuBarProps {
  api?: alphaTab.AlphaTabApi;
  score?: alphaTab.model.Score;
  onOpenFile: () => void;
  onOpenSettings: () => void;
  onToggleTrackSidebar: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({ 
  api, 
  score, 
  onOpenFile, 
  onOpenSettings, 
  onToggleTrackSidebar 
}) => {
  const { t } = useI18n();

  const handleExport = (format: 'gp' | 'midi' | 'xml' | 'print') => {
    if (!api || !score) return;

    try {
      switch (format) {
        case 'gp':
          console.log('Export GP functionality would be implemented here');
          break;
        case 'midi':
          console.log('Export MIDI functionality would be implemented here');
          break;
        case 'xml':
          console.log('Export MusicXML functionality would be implemented here');
          break;
        case 'print':
          api.print();
          break;
      }
    } catch (error) {
      console.error(`Export ${format} failed:`, error);
    }
  };

  return (
    <HStack 
      bg="gray.50" 
      borderBottomWidth="1px" 
      borderColor="gray.200" 
      px={4} 
      py={2} 
      justify="space-between"
      align="center"
    >
      <HStack gap={2}>
        <Text fontWeight="bold" color="teal.600">
          🥁 Alpha Drums
        </Text>
        {score && (
          <Text fontSize="sm" color="gray.600">
            - {score.title} {score.artist && `by ${score.artist}`}
          </Text>
        )}
      </HStack>

      <HStack gap={2}>
        <MenuRoot positioning={{ placement: "bottom-start" }}>
          <MenuTrigger asChild>
            <Button variant="outline" size="sm">
              📁 File
            </Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem value="open" onClick={onOpenFile}>
              🔍 Open File
            </MenuItem>
            <MenuSeparator />
            <MenuItem value="export-gp" onClick={() => handleExport('gp')} disabled={!score}>
              💾 Export as Guitar Pro
            </MenuItem>
            <MenuItem value="export-midi" onClick={() => handleExport('midi')} disabled={!score}>
              🎵 Export as MIDI
            </MenuItem>
            <MenuItem value="export-xml" onClick={() => handleExport('xml')} disabled={!score}>
              📄 Export as MusicXML
            </MenuItem>
            <MenuSeparator />
            <MenuItem value="print" onClick={() => handleExport('print')} disabled={!score}>
              🖨️ Print
            </MenuItem>
          </MenuContent>
        </MenuRoot>

        <MenuRoot positioning={{ placement: "bottom-start" }}>
          <MenuTrigger asChild>
            <Button variant="outline" size="sm">
              👁️ View
            </Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem value="toggle-tracks" onClick={onToggleTrackSidebar}>
              🎸 Toggle Tracks Sidebar
            </MenuItem>
          </MenuContent>
        </MenuRoot>

        <Button variant="outline" size="sm" onClick={onOpenSettings}>
          ⚙️ Settings
        </Button>

        <I18nSwitcher />
      </HStack>
    </HStack>
  );
};