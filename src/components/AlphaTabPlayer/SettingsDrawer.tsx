'use client';

import React from 'react';
import * as alphaTab from '@coderline/alphatab';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  VStack,
  HStack,
  Text,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Switch,
} from '@chakra-ui/react';

export interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  api: alphaTab.AlphaTabApi | undefined;
}

export function SettingsDrawer({ isOpen, onClose, api }: SettingsDrawerProps) {
  const [scale, setScale] = React.useState<number>(api?.settings.display.scale ?? 0.8);
  const [layout, setLayout] = React.useState<number>(api?.settings.display.layoutMode ?? alphaTab.LayoutMode.Page);
  const [staveProfile, setStaveProfile] = React.useState<number>(api?.settings.display.staveProfile ?? alphaTab.StaveProfile.ScoreTab);
  const [rhythmMode, setRhythmMode] = React.useState<number>(api?.settings.notation.rhythmMode ?? alphaTab.TabRhythmMode.Automatic);
  const [continuousScroll, setContinuousScroll] = React.useState<boolean>((api?.settings.player.scrollMode ?? alphaTab.ScrollMode.Continuous) === alphaTab.ScrollMode.Continuous);

  const apply = React.useCallback(() => {
    if (!api) return;
    api.settings.display.scale = scale;
    api.settings.display.layoutMode = layout as alphaTab.LayoutMode;
    api.settings.display.staveProfile = staveProfile as alphaTab.StaveProfile;
    api.settings.notation.rhythmMode = rhythmMode as alphaTab.TabRhythmMode;
    api.settings.player.scrollMode = continuousScroll ? alphaTab.ScrollMode.Continuous : alphaTab.ScrollMode.Page;
    api.updateSettings();
    api.render();
  }, [api, scale, layout, staveProfile, rhythmMode, continuousScroll]);

  React.useEffect(() => { apply(); }, [apply]);

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Settings</DrawerHeader>
        <DrawerBody>
          <VStack align="stretch" spacing={4}>
            <VStack align="stretch" spacing={2}>
              <Text fontSize="sm">Scale: {Math.round(scale * 100)}%</Text>
              <Slider min={0.5} max={2} step={0.05} value={scale} onChange={setScale}>
                <SliderTrack><SliderFilledTrack /></SliderTrack>
                <SliderThumb />
              </Slider>
            </VStack>

            <VStack align="stretch" spacing={2}>
              <Text fontSize="sm">Layout</Text>
              <Select value={layout} onChange={(e) => setLayout(Number(e.target.value))}>
                <option value={alphaTab.LayoutMode.Page}>Page</option>
                <option value={alphaTab.LayoutMode.Horizontal}>Horizontal</option>
              </Select>
            </VStack>

            <VStack align="stretch" spacing={2}>
              <Text fontSize="sm">Stave Profile</Text>
              <Select value={staveProfile} onChange={(e) => setStaveProfile(Number(e.target.value))}>
                <option value={alphaTab.StaveProfile.Score}>Score</option>
                <option value={alphaTab.StaveProfile.Tab}>Tab</option>
                <option value={alphaTab.StaveProfile.ScoreTab}>Score + Tab</option>
              </Select>
            </VStack>

            <VStack align="stretch" spacing={2}>
              <Text fontSize="sm">Tab Rhythm Mode</Text>
              <Select value={rhythmMode} onChange={(e) => setRhythmMode(Number(e.target.value))}>
                <option value={alphaTab.TabRhythmMode.Hide}>Hide</option>
                <option value={alphaTab.TabRhythmMode.Show}>Show</option>
                <option value={alphaTab.TabRhythmMode.Automatic}>Automatic</option>
              </Select>
            </VStack>

            <HStack justify="space-between">
              <Text fontSize="sm">Continuous Scroll</Text>
              <Switch isChecked={continuousScroll} onChange={(e) => setContinuousScroll(e.target.checked)} />
            </HStack>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}


