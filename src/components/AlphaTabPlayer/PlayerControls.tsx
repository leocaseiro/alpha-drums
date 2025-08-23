'use client';

import React, { useEffect, useState } from 'react';
import * as alphaTab from '@coderline/alphatab';
import { useAlphaTabEvent } from '@/lib/alphatab-utils';
import { useI18n } from '@/app/i18n';
import {
  Box,
  HStack,
  VStack,
  Button,
  Select,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  IconButton,
} from '@chakra-ui/react';

export interface PlayerControlsProps {
  api: alphaTab.AlphaTabApi;
  onOpenFileClick: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({ api, onOpenFileClick }) => {
  const { t } = useI18n();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReadyForPlayback, setIsReadyForPlayback] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [isCountInActive, setIsCountInActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [endTime, setEndTime] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [baseTempoBpm, setBaseTempoBpm] = useState<number | null>(null);
  const [metronomeVolume, setMetronomeVolume] = useState(1);
  const [countInVolume, setCountInVolume] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [layoutMode, setLayoutMode] = useState<alphaTab.LayoutMode>(alphaTab.LayoutMode.Page);

  useAlphaTabEvent(api, 'playerStateChanged', (e) => {
    setIsPlaying((e as unknown as { state: alphaTab.synth.PlayerState }).state === alphaTab.synth.PlayerState.Playing);
  });

  useAlphaTabEvent(api, 'playerPositionChanged', (e) => {
    const event = e as unknown as { currentTime: number; endTime: number };
    const previousCurrentSeconds = (currentTime / 1000) | 0;
    const newCurrentSeconds = (event.currentTime / 1000) | 0;

    if (
      event.endTime === endTime &&
      (previousCurrentSeconds === newCurrentSeconds || newCurrentSeconds === 0)
    ) {
      return;
    }

    setEndTime(event.endTime);
    setCurrentTime(event.currentTime);
  });

  // Add event listeners for player readiness
  useAlphaTabEvent(api, 'playerReady', () => {
    console.log('Player ready event fired');
    setIsReadyForPlayback(true);
  });

  useAlphaTabEvent(api, 'soundFontLoaded', () => {
    console.log('SoundFont loaded event fired');
    setIsReadyForPlayback(true);
  });

  useAlphaTabEvent(api, "playerStateChanged", (e) => {
    console.log('Player state changed event fired', e);
    console.log('Player state changed event fired string', JSON.stringify(e));
  });
  useAlphaTabEvent(api, "playerPositionChanged", (e) => {
    console.log('Player position changed event fired', e);
    console.log('Player position changed event fired string', JSON.stringify(e));
  });



  // Check readiness and force enable if we have a score
  useEffect(() => {
    const checkReadiness = () => {
      if (api) {
        const ready = api.isReadyForPlayback;
        const hasScore = api.score !== null;
        console.log('Checking readiness:', ready, 'Has score:', hasScore, 'Player mode:', api.settings?.player?.playerMode);
        if (hasScore && !baseTempoBpm) {
          try {
            const tempo = api.score?.tempo ?? null;
            if (tempo) setBaseTempoBpm(tempo);
          } catch {
            // ignore
          }
        }

        // Force enable controls if we have a score (even without full audio synthesis)
        if (hasScore) {
          console.log('Score loaded - enabling controls for basic playback');
          setIsReadyForPlayback(true);
        } else {
          setIsReadyForPlayback(ready);
        }
      }
    };

    checkReadiness();
    const interval = setInterval(checkReadiness, 2000);
    return () => clearInterval(interval);
  }, [api]);

  // Apply settings when they change
  useEffect(() => {
    api.isLooping = isLooping;
  }, [api, isLooping]);

  useEffect(() => {
    api.metronomeVolume = isMetronomeActive ? metronomeVolume : 0;
  }, [api, isMetronomeActive, metronomeVolume]);

  useEffect(() => {
    api.countInVolume = isCountInActive ? countInVolume : 0;
  }, [api, isCountInActive, countInVolume]);

  useEffect(() => {
    api.playbackSpeed = playbackSpeed;
  }, [api, playbackSpeed]);

  useEffect(() => {
    if (api) {
      api.settings.display.scale = zoom / 100.0;
      api.updateSettings();
      api.render();
    }
  }, [api, zoom]);

  useEffect(() => {
    if (api) {
      api.settings.display.layoutMode = layoutMode;
      api.updateSettings();
      api.render();
    }
  }, [api, layoutMode]);

  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = Number(e.target.value) / 100;
    const newTime = endTime * percentage;
    api.tickPosition = newTime;
  };

  // Keyboard controls
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (!api) return;
      if (ev.key === ' ') {
        ev.preventDefault();
        try { (api.player as unknown as { activate?: () => void })?.activate?.(); } catch {}
        api.playPause();
      } else if (ev.key.toLowerCase() === 'l') {
        setIsLooping((v) => !v);
      } else if (ev.key.toLowerCase() === 'm') {
        setIsMetronomeActive((v) => !v);
      } else if (ev.key === '+') {
        setPlaybackSpeed((s) => Math.min(2, Math.round((s + 0.05) * 20) / 20));
      } else if (ev.key === '-') {
        setPlaybackSpeed((s) => Math.max(0.25, Math.round((s - 0.05) * 20) / 20));
      } else if (ev.key.toLowerCase() === 's') {
        try { api.stop(); } catch {}
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [api]);

  const handleExport = (format: 'gp' | 'midi') => {
    if (!api.score) return;

    try {
      if (format === 'gp') {
        // Export functionality temporarily disabled due to type issues
        console.log('Export functionality would be implemented here');
        alert('Export functionality coming soon!');
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handlePrint = () => {
    try {
      api.print();
    } catch (error) {
      console.error('Print failed:', error);
    }
  };

  return (
    <VStack bg="gray.50" borderTopWidth="1px" borderColor="gray.200" p={4} spacing={4} align="stretch">
      <HStack align="center" spacing={3}>
        <Text fontFamily="mono" fontSize="sm" color="gray.600" minW="120px">
          {formatDuration(currentTime)} / {formatDuration(endTime)}
        </Text>
        <Slider min={0} max={100} value={endTime > 0 ? (currentTime / endTime) * 100 : 0} onChange={(v) => handleSeek({ target: { value: String(v) } } as unknown as React.ChangeEvent<HTMLInputElement>)} flex="1">
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </HStack>

      <HStack align="center" spacing={4}>
        <IconButton aria-label={t('player.stop')} onClick={() => { try { api.stop(); } catch { setIsPlaying(false); } }} isDisabled={!isReadyForPlayback}>
          ⏹️
        </IconButton>
        <Button onClick={() => { try { (api.player as unknown as { activate?: () => void })?.activate?.(); if (!api.isReadyForPlayback) { try { api.loadSoundFontFromUrl('/soundfont/sonivox.sf3', false); } catch {} try { api.loadSoundFontFromUrl('/soundfont/sonivox.sf2', false); } catch {} } api.playPause(); } catch { setIsPlaying(!isPlaying); } }} isDisabled={!isReadyForPlayback} colorScheme="green">
          {isPlaying ? t('player.pause') : t('player.play')}
        </Button>

        <VStack minW="180px" spacing={1} align="stretch">
          <Text fontSize="xs" color="gray.600">{t('player.speed')}: {Math.round(playbackSpeed * 100)}%{baseTempoBpm ? ` • ${Math.round(baseTempoBpm * playbackSpeed)} BPM` : ''}</Text>
          <Slider min={0.25} max={2} step={0.05} value={playbackSpeed} onChange={(v) => setPlaybackSpeed(v as number)}>
            <SliderTrack><SliderFilledTrack /></SliderTrack>
            <SliderThumb />
          </Slider>
        </VStack>

        <VStack minW="180px" spacing={1} align="stretch">
          <Text fontSize="xs" color="gray.600">🔍 {t('player.zoom')}: {zoom}%</Text>
          <Slider min={25} max={200} step={5} value={zoom} onChange={(v) => setZoom(v as number)}>
            <SliderTrack><SliderFilledTrack /></SliderTrack>
            <SliderThumb />
          </Slider>
        </VStack>
      </HStack>

      <HStack spacing={3} wrap="wrap">
        <input type="file" accept=".gp,.gp3,.gp4,.gp5,.gpx,.musicxml,.mxml,.xml,.capx" onChange={onOpenFileClick} style={{ display: 'none' }} id="file-input" />
        <label htmlFor="file-input" title={t('player.openFile')}>
          <Button as="span">🔍</Button>
        </label>

        <Button variant={isLooping ? 'solid' : 'outline'} colorScheme="blue" onClick={() => setIsLooping(!isLooping)} isDisabled={!isReadyForPlayback}>🔁 {t('player.loop')}</Button>

        <HStack>
          <Button variant={isMetronomeActive ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setIsMetronomeActive(!isMetronomeActive)} isDisabled={!isReadyForPlayback}>🎼 {t('player.metronome')}</Button>
          {isMetronomeActive && (
            <HStack>
              <Slider min={0} max={1} step={0.1} value={metronomeVolume} onChange={(v) => setMetronomeVolume(v as number)} w="80px">
                <SliderTrack><SliderFilledTrack /></SliderTrack>
                <SliderThumb />
              </Slider>
              <Text fontSize="xs">{Math.round(metronomeVolume * 100)}%</Text>
            </HStack>
          )}
        </HStack>

        <HStack>
          <Button variant={isCountInActive ? 'solid' : 'outline'} colorScheme="orange" onClick={() => setIsCountInActive(!isCountInActive)} isDisabled={!isReadyForPlayback}>⏳ {t('player.countIn')}</Button>
          {isCountInActive && (
            <HStack>
              <Slider min={0} max={1} step={0.1} value={countInVolume} onChange={(v) => setCountInVolume(v as number)} w="80px">
                <SliderTrack><SliderFilledTrack /></SliderTrack>
                <SliderThumb />
              </Slider>
              <Text fontSize="xs">{Math.round(countInVolume * 100)}%</Text>
            </HStack>
          )}
        </HStack>

        <HStack>
          <Text fontSize="sm">📄 {t('player.layout')}:</Text>
          <Select value={layoutMode} onChange={(e) => setLayoutMode(Number(e.target.value) as alphaTab.LayoutMode)} maxW="200px">
            <option value={alphaTab.LayoutMode.Page}>{t('player.page')}</option>
            <option value={alphaTab.LayoutMode.Horizontal}>{t('player.horizontal')}</option>
          </Select>
        </HStack>

        <HStack>
          <Button onClick={() => handleExport('gp')} isDisabled={!isReadyForPlayback}>💾 {t('player.export')}</Button>
          <Button onClick={() => handlePrint()} isDisabled={!isReadyForPlayback}>🖨️ {t('player.print')}</Button>
        </HStack>
      </HStack>
    </VStack>
  );
};
