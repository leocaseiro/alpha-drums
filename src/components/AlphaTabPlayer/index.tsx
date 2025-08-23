'use client';

import React, { useState, useCallback } from 'react';
import * as alphaTab from '@coderline/alphatab';
import { useAlphaTab, useAlphaTabEvent, openFile } from '@/lib/alphatab-utils';
import { useI18n } from '@/app/i18n';
import { TrackItem } from './TrackItem';
import { PlayerControls } from './PlayerControls';

import { AbsoluteCenter, Box, Center, Text, VStack, Button, Flex } from '@chakra-ui/react';
import { toaster } from '@/app/toaster';
import { ProgressCircle } from '@chakra-ui/react';
import { SettingsDrawer } from './SettingsDrawer';
import { MenuBar } from './MenuBar';

export const AlphaTabPlayer: React.FC = () => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false); // Start as false - only show when actually loading
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [score, setScore] = useState<alphaTab.model.Score>();
  const [selectedTracks, setSelectedTracks] = useState(new Map<number, alphaTab.model.Track>());
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const viewPortRef = React.createRef<HTMLDivElement>();

  const settingsSetup = useCallback((settings: alphaTab.Settings) => {
    // Player configuration - use a mode that works without full synthesis
    settings.player.playerMode = alphaTab.PlayerMode.EnabledSynthesizer; // Force synth playback
    settings.player.outputMode = alphaTab.PlayerOutputMode.WebAudioScriptProcessor; // Avoid worklet requirements in dev
    settings.player.scrollMode = alphaTab.ScrollMode.Continuous;
    settings.player.enablePlayer = true;
    settings.player.enableCursor = true;

    // Display configuration
    settings.display.scale = 0.8;
    settings.display.layoutMode = alphaTab.LayoutMode.Page;
    settings.display.staveProfile = alphaTab.StaveProfile.ScoreTab;

    // Default to showing rhythm on tabs
    settings.notation.rhythmMode = alphaTab.TabRhythmMode.Automatic;

    console.log('Player settings configured:', {
      playerMode: settings.player.playerMode,
      useWorkers: settings.core.useWorkers,
      enableCursor: settings.player.enableCursor,
      scrollMode: settings.player.scrollMode
    });
  }, []);

  const [api, element, isApiReady] = useAlphaTab(settingsSetup);

  // Configure scrolling when API becomes ready
  React.useEffect(() => {
    if (api && isApiReady && viewPortRef.current) {
      try {
        console.log('Configuring scroll element for alphaTab');
        api.settings.player.scrollElement = viewPortRef.current;
        api.settings.player.scrollOffsetY = -10;
        api.updateSettings();
      } catch (error) {
        console.error('Error configuring scroll element:', error);
      }
    }
  }, [api, isApiReady, viewPortRef]);

  // Trigger resize only once when API becomes ready and has a score
  React.useEffect(() => {
    if (api && isApiReady && score) {
      const timer = setTimeout(() => {
        try {
          console.log('Triggering one-time resize for loaded score');
          api.updateSettings();
        } catch (error) {
          console.error('Error during settings update:', error);
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [api, isApiReady, score]);

  // Show loading when file starts loading
  useAlphaTabEvent(api, 'scoreLoaded', (loadedScore) => {
    console.log('Score loaded event fired', loadedScore);
    setIsLoading(true); // Start loading when score is loaded and rendering begins
    setLoadingProgress(30); // File loaded
    setScore(loadedScore as alphaTab.model.Score);
    toaster.create({ type: 'success', title: t('player.loaded'), description: t('player.readyToPlay') });
  });

  useAlphaTabEvent(api, 'renderStarted', () => {
    console.log('Render started event fired');
    setLoadingProgress(60); // Rendering started
    // Set up initial track selection
    if (api && api.tracks) {
      const trackMap = new Map<number, alphaTab.model.Track>();
      api.tracks.forEach((track) => {
        trackMap.set(track.index, track);
      });
      setSelectedTracks(trackMap);
    }
    // Keep loading state as true during rendering
  });

  useAlphaTabEvent(api, 'renderFinished', () => {
    console.log('Render finished event fired');
    setLoadingProgress(100); // Rendering complete
    setTimeout(() => {
      setIsLoading(false);
      setLoadingProgress(0);
    }, 300); // Brief delay to show completion
  });

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input event fired');
    const file = event.target.files?.[0];
    if (file && api && isApiReady) {
      setIsLoading(true); // Show loading immediately when file is selected
      setLoadingProgress(10); // File selected
      setScore(undefined); // Clear previous score
      openFile(api, file);

      // Fallback timeout to hide loading overlay if events don't fire
      setTimeout(() => {
        console.log('Fallback timeout - hiding loading overlay');
        setIsLoading(false);
        setLoadingProgress(0);
      }, 10000); // 10 seconds timeout
    } else if (file && (!api || !isApiReady)) {
      console.error('AlphaTab API not ready yet');
      toaster.create({ type: 'error', title: t('player.error'), description: t('player.initializing') });
    }
  };

  const triggerFileInput = () => {
    const input = document.getElementById('file-input') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  const handleToggleTrack = (track: alphaTab.model.Track) => {
    const newSelectedTracks = new Map(selectedTracks);

    if (newSelectedTracks.has(track.index)) {
      newSelectedTracks.delete(track.index);
    } else {
      newSelectedTracks.set(track.index, track);
    }

    setSelectedTracks(newSelectedTracks);

    // Update AlphaTab to render only selected tracks
    if (newSelectedTracks.size > 0) {
      api?.renderTracks(Array.from(newSelectedTracks.values()));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 1 && api && isApiReady) {
      setIsLoading(true); // Show loading immediately when file is dropped
      setLoadingProgress(10); // File selected
      toaster.create({ type: 'info', title: t('player.loading'), description: files[0].name });
      setScore(undefined); // Clear previous score
      openFile(api, files[0]);
    } else if (files.length === 1 && (!api || !isApiReady)) {
      console.error('AlphaTab API not ready yet');
      toaster.create({ type: 'error', title: t('player.error'), description: t('player.initializing') });
    }
  };

  return (
    <Flex direction="column" w="full" h="100vh" position="relative">
      <MenuBar
        api={api ?? undefined}
        score={score}
        onOpenFile={triggerFileInput}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleTrackSidebar={() => setSidebarVisible(!isSidebarVisible)}
      />
      {isLoading && (
        <Box position="absolute" inset={0} bg="blackAlpha.700" zIndex={1000}>
          <Center w="full" h="full" flexDirection="column" color="white" gap={3}>
            <ProgressCircle.Root value={loadingProgress} size="lg" colorScheme="teal">
              <ProgressCircle.Circle>
                <ProgressCircle.Track />
                <ProgressCircle.Range />
              </ProgressCircle.Circle>
              <AbsoluteCenter>
                <ProgressCircle.ValueText />
              </AbsoluteCenter>
            </ProgressCircle.Root>
            <Text fontSize="md" color="white" textAlign="center">
              {loadingProgress < 30 ? t('player.loading') :
               loadingProgress < 60 ? 'Processing score...' :
               loadingProgress < 100 ? 'Rendering notation...' :
               'Almost ready!'}
            </Text>
          </Center>
        </Box>
      )}

      {!score && (
        <Center
          flex="1"
          border="2px dashed"
          borderColor="gray.300"
          borderRadius="md"
          bg="gray.50"
          m={5}
          transition="all 0.2s"
          _hover={{ bg: "gray.100", borderColor: "gray.500" }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          minH="400px"
        >
          <VStack gap={4} p={8}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.700">
              {t('player.loadFile')}
            </Text>
            <Text fontSize="md" color="gray.600" textAlign="center">
              {t('player.dragDropFile')}
            </Text>
            <input
              type="file"
              accept=".gp,.gp3,.gp4,.gp5,.gpx,.musicxml,.mxml,.xml,.capx"
              onChange={handleFileInput}
              style={{ display: 'none' }}
              id="file-input"
            />
            <Button
              size="lg"
              colorScheme="blue"
              disabled={!isApiReady}
              title={!isApiReady ? 'Initializing player...' : t('player.openFile')}
              onClick={triggerFileInput}
            >
              {!isApiReady ? 'Initializing...' : `🔍 ${t('player.openFile')}`}
            </Button>
          </VStack>
        </Center>
      )}

      <Flex flex="1" gap={4} overflow="hidden">
        {score && isSidebarVisible && (
          <Box
            w="320px"
            bg="gray.50"
            borderRightWidth="1px"
            borderColor="gray.200"
            p={4}
            overflowY="auto"
            flexShrink={0}
            css={{ resize: 'horizontal' }}
          >
            <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={4}>
              {t('player.tracks')}
            </Text>
            <VStack align="stretch" gap={0}>
              {score.tracks.map((track) => (
                <TrackItem
                  key={track.index}
                  api={api!}
                  track={track}
                  isSelected={selectedTracks.has(track.index)}
                  onToggleShow={handleToggleTrack}
                />
              ))}
            </VStack>
          </Box>
        )}

        <Box
          flex="1"
          overflow="auto"
          bg="white"
          borderWidth="1px"
          borderColor="gray.300"
          position="relative"
          css={{ scrollBehavior: 'smooth' }}
          ref={viewPortRef}
        >
          <Box w="full" h="auto" minH="500px" ref={element} />
        </Box>
      </Flex>

      {api && score && <PlayerControls api={api} onOpenFileClick={handleFileInput} />}
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} api={api ?? undefined} />
    </Flex>
  );
};
