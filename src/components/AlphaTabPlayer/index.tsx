'use client';

import React, { useState, useCallback } from 'react';
import * as alphaTab from '@coderline/alphatab';
import { useAlphaTab, useAlphaTabEvent, openFile } from '@/lib/alphatab-utils';
import { useI18n } from '@/app/i18n';
import { TrackItem } from './TrackItem';
import { PlayerControls } from './PlayerControls';

import { AbsoluteCenter, Box, Center, Text, VStack, HStack, Button, Flex } from '@chakra-ui/react';
import { toaster } from '@/app/toaster';
import { ProgressCircle } from '@chakra-ui/react';
import { SettingsDrawer } from './SettingsDrawer';
import { MenuBar } from './MenuBar';
import { MidiSettingsDrawer } from '../Midi/MidiSettingsDrawer';
import { MidiHistoryDrawer } from '../Midi/MidiHistoryDrawer';
import { MidiGameDrawer } from '../Midi/MidiGameDrawer';
import { AlphaTabNoteHighlighter } from '../Midi/AlphaTabNoteHighlighter';
import { MidiScoreDisplay } from '../Midi/MidiScoreDisplay';
import { RhythmGame } from '../Midi/RhythmGame';
import { debugLog } from '@/lib/debug';

export const AlphaTabPlayer: React.FC = () => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false); // Start as false - only show when actually loading
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [score, setScore] = useState<alphaTab.model.Score>();
  const [selectedTracks, setSelectedTracks] = useState(new Map<number, alphaTab.model.Track>());
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [singleTrackMode, setSingleTrackMode] = useState<alphaTab.model.Track | null>(null);
  const [isMidiSettingsOpen, setMidiSettingsOpen] = useState(false);
  const [isMidiHistoryOpen, setMidiHistoryOpen] = useState(false);
  const [isMidiGameOpen, setMidiGameOpen] = useState(false);
  const [isGameEnabled, setGameEnabled] = useState(false);
  const [isPracticeMode, setPracticeMode] = useState(false);
  const [gameState, setGameState] = useState({
    isPlaying: false,
    isPracticeMode: false,
    isSessionActive: false,
    score: 0,
    streak: 0,
    totalNotes: 0,
    hitNotes: 0,
    perfectHits: 0,
    goodHits: 0,
    lateHits: 0,
    earlyHits: 0,
    missedNotes: 0,
    extraNotes: 0,
    accuracy: 0,
    stars: 0,
  });
  const rhythmGameRef = React.useRef<{ startGame: (practice: boolean) => void; stopGame: () => void } | null>(null);
  const viewPortRef = React.useRef<HTMLDivElement>(null);
  const visibleTracksArray = React.useMemo(() => Array.from(selectedTracks.values()), [selectedTracks]);

  const settingsSetup = useCallback((settings: alphaTab.Settings) => {
    // Player configuration - use a mode that works with cursors
    settings.player.playerMode = alphaTab.PlayerMode.EnabledSynthesizer; // Force synth playback
    settings.player.outputMode = alphaTab.PlayerOutputMode.WebAudioScriptProcessor; // Use script processor for compatibility
    settings.player.scrollMode = alphaTab.ScrollMode.Continuous;
    settings.player.enablePlayer = true;
    settings.player.enableCursor = true;
    settings.player.enableAnimatedBeatCursor = true;
    settings.player.enableElementHighlighting = true;
    settings.player.enableUserInteraction = true;

    // Display configuration
    settings.display.scale = 0.8;
    settings.display.layoutMode = alphaTab.LayoutMode.Horizontal;
    settings.display.staveProfile = alphaTab.StaveProfile.ScoreTab;

    // Default to showing rhythm on tabs
    settings.notation.rhythmMode = alphaTab.TabRhythmMode.Automatic;

    console.log('Player settings configured:', {
      playerMode: settings.player.playerMode,
      useWorkers: settings.core.useWorkers,
      enableCursor: settings.player.enableCursor,
      enableAnimatedBeatCursor: settings.player.enableAnimatedBeatCursor,
      enableElementHighlighting: settings.player.enableElementHighlighting,
      enableUserInteraction: settings.player.enableUserInteraction,
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
        api.settings.player.scrollMode = alphaTab.ScrollMode.Continuous;
        api.settings.player.enableCursor = true;
        api.settings.player.enablePlayer = true;
        api.settings.player.enableUserInteraction = true;
        console.log('api', api);

        console.log('Updated player settings:', {
          scrollElement: !!api.settings.player.scrollElement,
          scrollMode: api.settings.player.scrollMode,
          enableCursor: api.settings.player.enableCursor,
          enablePlayer: api.settings.player.enablePlayer,
          playerMode: api.settings.player.playerMode,
          enableAnimatedBeatCursor: api.settings.player.enableAnimatedBeatCursor,
          enableElementHighlighting: api.settings.player.enableElementHighlighting
        });

        api.updateSettings();
        // Force a render to apply the new settings
        if (api.score) {
          api.render();

          // Additional attempt to ensure cursor is visible
          setTimeout(() => {
            try {
              console.log('Attempting additional cursor setup...');
              const container = viewPortRef.current;
              if (container) {
                // Check if cursor elements exist
                const cursorElements = container.querySelectorAll('.at-cursor-bar, .at-cursor-beat');
                console.log('Found cursor elements:', cursorElements.length);

                // Force cursor visibility
                api.settings.player.enableCursor = true;
                api.updateSettings();
              }
            } catch (error) {
              console.log('Additional cursor setup failed:', error);
            }
          }, 1000);
        }
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
    // Set up initial track selection - default to drums only
    if (api && api.tracks) {
      const trackMap = new Map<number, alphaTab.model.Track>();
      // Find percussion tracks (drums) first
      const drumTracks = api.tracks.filter((track) =>
        track.staves.some((stave) => stave.isPercussion)
      );

      if (drumTracks.length > 0) {
        // Default to drums only
        drumTracks.forEach((track) => {
          trackMap.set(track.index, track);
        });
        console.log('Defaulting to drum tracks:', drumTracks.map(t => t.name));
      } else {
        // Fallback to all tracks if no drums found
        api.tracks.forEach((track) => {
          trackMap.set(track.index, track);
        });
        console.log('No drum tracks found, showing all tracks');
      }
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

      // Try to activate the player after render is complete
      if (api && api.player) {
        try {
          console.log('Attempting to activate player after render...');
          (api.player as unknown as { activate?: () => void })?.activate?.();
        } catch (error) {
          console.log('Player activation failed (expected in some cases):', error);
        }
      }
    }, 300); // Brief delay to show completion
  });

  // Add debug events for cursor and playback
  useAlphaTabEvent(api, 'playerStateChanged', (e) => {
    debugLog.log('Player state changed:', e);
    const state = (e as unknown as { state: alphaTab.synth.PlayerState }).state;
    const isPlaying = state === alphaTab.synth.PlayerState.Playing;

    debugLog.log('🎵 Player state:', {
      isPlaying,
      gameEnabled: isGameEnabled,
      gameIsPlaying: gameState.isPlaying,
      practiceMode: isPracticeMode
    });

    // Auto-start/stop game when player starts/stops
    if (isGameEnabled && rhythmGameRef.current) {
      if (isPlaying && !gameState.isPlaying) {
        debugLog.log('🎮 Auto-starting game from player state change');
        rhythmGameRef.current.startGame(isPracticeMode);
      } else if (!isPlaying && gameState.isPlaying) {
        debugLog.log('🎮 Auto-stopping game from player state change');
        rhythmGameRef.current.stopGame();
      }
    }
  });

  useAlphaTabEvent(api, 'playerPositionChanged', (e) => {
    debugLog.log('Player position changed:', e);
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
    setSingleTrackMode(null); // Exit single track mode when toggling

    // Update AlphaTab to render only selected tracks
    if (newSelectedTracks.size > 0) {
      api?.renderTracks(Array.from(newSelectedTracks.values()));
    }
  };

  const handleShowOnlyTrack = (track: alphaTab.model.Track) => {
    setSingleTrackMode(track);
    const singleTrackMap = new Map<number, alphaTab.model.Track>();
    singleTrackMap.set(track.index, track);
    setSelectedTracks(singleTrackMap);
    api?.renderTracks([track]);
    toaster.create({
      type: 'info',
      title: 'Single Track Mode',
      description: `Now showing only "${track.name}"`
    });
  };

  const handleShowAllTracks = () => {
    if (score) {
      setSingleTrackMode(null);
      const allTracksMap = new Map<number, alphaTab.model.Track>();
      score.tracks.forEach((track) => {
        allTracksMap.set(track.index, track);
      });
      setSelectedTracks(allTracksMap);
      api?.renderTracks(score.tracks);
      toaster.create({
        type: 'info',
        title: 'All Tracks Mode',
        description: 'Now showing all tracks'
      });
    }
  };

  const handleShowDrumsOnly = () => {
    if (score) {
      setSingleTrackMode(null);
      const drumTracks = score.tracks.filter((track) =>
        track.staves.some((stave) => stave.isPercussion)
      );

      if (drumTracks.length > 0) {
        const drumTracksMap = new Map<number, alphaTab.model.Track>();
        drumTracks.forEach((track) => {
          drumTracksMap.set(track.index, track);
        });
        setSelectedTracks(drumTracksMap);
        api?.renderTracks(drumTracks);
        toaster.create({
          type: 'info',
          title: 'Drums Only Mode',
          description: `Now showing ${drumTracks.length} drum track(s)`
        });
      }
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
        onOpenMidiSettings={() => setMidiSettingsOpen(true)}
        onOpenMidiHistory={() => setMidiHistoryOpen(true)}
        onOpenMidiGame={() => setMidiGameOpen(true)}
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
            <VStack align="stretch" mb={4} gap={2}>
              <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                {t('player.tracks')}
              </Text>
              <HStack gap={1}>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleShowAllTracks}
                  disabled={!singleTrackMode && selectedTracks.size === score.tracks.length}
                >
                  All
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleShowDrumsOnly}
                  colorScheme="orange"
                >
                  🥁 Drums
                </Button>
                {singleTrackMode && (
                  <Button
                    size="xs"
                    variant="solid"
                    colorScheme="teal"
                    onClick={handleShowAllTracks}
                  >
                    Exit Solo
                  </Button>
                )}
              </HStack>
            </VStack>
            <VStack align="stretch" gap={0}>
              {score.tracks.map((track) => (
                <TrackItem
                  key={track.index}
                  api={api!}
                  track={track}
                  isSelected={selectedTracks.has(track.index)}
                  isSingleTrackMode={singleTrackMode?.index === track.index}
                  onToggleShow={handleToggleTrack}
                  onShowOnlyTrack={handleShowOnlyTrack}
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
          {/* MIDI Note Highlighter - only active when score is loaded */}
          {api && score && <AlphaTabNoteHighlighter api={api} enabled={isGameEnabled} />}

          {/* Hidden Rhythm Game Logic - only when game is enabled */}
          {api && score && isGameEnabled && (
            <RhythmGame
              api={api}
              score={score}
              ref={rhythmGameRef}
              onGameStateChange={setGameState}
              practiceMode={isPracticeMode}
              hideUI={true}
              visibleTracks={visibleTracksArray}
              // Toggle this to true to see upcoming expected notes window while debugging
              showDebug={false}
            />
          )}
        </Box>
      </Flex>

      {api && score && (
        <>
          {/* MIDI Score Display */}
          {isGameEnabled && (
            <Box p={4}>
              <MidiScoreDisplay gameState={gameState} isGameEnabled={isGameEnabled} />
            </Box>
          )}

          <PlayerControls
            api={api}
            onOpenFileClick={handleFileInput}
            isGameEnabled={isGameEnabled}
            isPracticeMode={isPracticeMode}
            onGameToggle={setGameEnabled}
            onPracticeModeToggle={setPracticeMode}
          />
        </>
      )}
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} api={api ?? undefined} />
      <MidiSettingsDrawer isOpen={isMidiSettingsOpen} onClose={() => setMidiSettingsOpen(false)} />
      <MidiHistoryDrawer isOpen={isMidiHistoryOpen} onClose={() => setMidiHistoryOpen(false)} />
      <MidiGameDrawer isOpen={isMidiGameOpen} onClose={() => setMidiGameOpen(false)} />
    </Flex>
  );
};
