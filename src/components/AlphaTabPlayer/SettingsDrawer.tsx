'use client';

import React from 'react';
import * as alphaTab from '@coderline/alphatab';
import {
  Button,
  Drawer,
  VStack,
  HStack,
  Text,
  Select,
  Slider,
  Switch,
  CloseButton,
  Portal,
  createListCollection,
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

  const layoutModes = createListCollection({
    items: [
      { label: "Page", value: alphaTab.LayoutMode.Page },
      { label: "Horizontal", value: alphaTab.LayoutMode.Horizontal },
    ],
  })

  const staveProfiles = createListCollection({
    items: [
      { label: "Score", value: alphaTab.StaveProfile.Score },
      { label: "Tab", value: alphaTab.StaveProfile.Tab },
      { label: "Score + Tab", value: alphaTab.StaveProfile.ScoreTab },
    ],
  })

  const rhythmModes = createListCollection({
    items: [
      { label: "Automatic", value: alphaTab.TabRhythmMode.Automatic },
      { label: "Hide", value: alphaTab.TabRhythmMode.Hidden },
    ],
  })

  // const scrollModes = createListCollection({
  //   items: [
  //     { label: "Continuous", value: alphaTab.ScrollMode.Continuous },
  //     { label: "Page", value: alphaTab.ScrollMode.Page },
  //   ],
  // })

  // const playerModes = createListCollection({
  //   items: [
  //     { label: "Enabled Synthesizer", value: alphaTab.PlayerMode.EnabledSynthesizer },
  //     { label: "Disabled Synthesizer", value: alphaTab.PlayerMode.DisabledSynthesizer },
  //   ],
  // })

  React.useEffect(() => { apply(); }, [apply]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Drawer Title</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <VStack align="stretch" gap={4}>
              <VStack align="stretch" gap={2}>
                <Text fontSize="sm">Scale: {Math.round(scale * 100)}%</Text>
                <Slider.Root min={0.5} max={2} step={0.05} value={[scale]} onValueChange={(e) => setScale(e.value[0])}>
                  <Slider.Track>
                    <Slider.Range />
                  </Slider.Track>
                  <Slider.Thumb index={0}>
                    <Slider.DraggingIndicator />
                    <Slider.HiddenInput />
                  </Slider.Thumb>
                </Slider.Root>
              </VStack>

              <VStack align="stretch" gap={2}>
                <Text fontSize="sm">Layout</Text>
                <Select.Root collection={layoutModes} value={[layout.toString()]} onValueChange={(e) => setLayout(Number(e.value[0]))}>
                  <Select.Trigger>
                    <Select.ValueText />
                  </Select.Trigger>
                  <Select.Content>
                  {layoutModes.items.map((layoutMode) => (
                    <Select.Item item={layoutMode} key={layoutMode.value}>
                      {layoutMode.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
                </Select.Root>
              </VStack>

              <VStack align="stretch" gap={2}>
                <Text fontSize="sm">Stave Profile</Text>
                <Select.Root collection={staveProfiles} value={[staveProfile.toString()]} onValueChange={(e) => setStaveProfile(Number(e.value[0]))}>
                  <Select.Trigger>
                    <Select.ValueText />
                  </Select.Trigger>
                  <Select.Content>
                    {staveProfiles.items.map((staveProfile) => (
                      <Select.Item item={staveProfile} key={staveProfile.value}>
                        {staveProfile.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </VStack>

              <VStack align="stretch" gap={2}>
                <Text fontSize="sm">Tab Rhythm Mode</Text>
                <Select.Root collection={rhythmModes} value={[rhythmMode.toString()]} onValueChange={(e) => setRhythmMode(Number(e.value[0]))}>
                  <Select.Trigger>
                    <Select.ValueText />
                  </Select.Trigger>
                  <Select.Content>
                    {rhythmModes.items.map((rhythmMode) => (
                      <Select.Item item={rhythmMode} key={rhythmMode.value}>
                        {rhythmMode.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </VStack>

              <HStack justify="space-between">
                <Text fontSize="sm">Continuous Scroll</Text>
                <Switch.Root checked={continuousScroll} onCheckedChange={(e) => setContinuousScroll(e.checked)}>
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Switch.Label />
              </Switch.Root>
              </HStack>
            </VStack>
            </Drawer.Body>
            <Drawer.Footer>
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
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
