'use client';

import React, { useEffect, useState } from 'react';
import * as alphaTab from '@coderline/alphatab';
import { useI18n } from '@/app/i18n';
import { Box, HStack, VStack, Text, Button, ButtonGroup, Slider, Switch } from '@chakra-ui/react';

export interface TrackItemProps {
  api: alphaTab.AlphaTabApi;
  track: alphaTab.model.Track;
  isSelected: boolean;
  onToggleShow?: (track: alphaTab.model.Track) => void;
}

export const TrackItem: React.FC<TrackItemProps> = ({ api, track, isSelected, onToggleShow }) => {
  const { t } = useI18n();
  const [isMute, setMute] = useState(track.playbackInfo.isMute);
  const [isSolo, setSolo] = useState(track.playbackInfo.isSolo);
  const [volume, setVolume] = useState(track.playbackInfo.volume);

  useEffect(() => {
    track.playbackInfo.isMute = isMute;
    api.changeTrackMute([track], isMute);
  }, [api, track, isMute]);

  useEffect(() => {
    track.playbackInfo.isSolo = isSolo;
    api.changeTrackSolo([track], isSolo);
  }, [api, track, isSolo]);

  useEffect(() => {
    track.playbackInfo.volume = volume;
    api.changeTrackVolume([track], volume / 16); // normalize to 0-1
  }, [api, track, volume]);

  const getTrackIcon = () => {
    if (track.staves.some((s) => s.isPercussion)) {
      return '🥁';
    }
    return '🎸';
  };

  const handleShowToggle = (details: { checked: boolean }) => {
    console.log('handleShowToggle', details);
    if (onToggleShow) {
      onToggleShow(track);
    }
  };

  return (
    <Box borderWidth="1px" borderRadius="md" p={3} mb={2} bg="white" _hover={{ shadow: 'sm', borderColor: 'blue.400' }} borderColor={isSelected ? 'blue.400' : 'gray.200'}>
      <HStack gap={2} mb={2} align="center">
        <Text fontSize="lg" w="24px" textAlign="center">{getTrackIcon()}</Text>
        <Text flex="1" fontWeight="medium">{track.name}</Text>
        <HStack>
          <Text fontSize="sm">{t('player.showTrack')}</Text>
          <Switch.Root checked={isSelected} onCheckedChange={handleShowToggle}>
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </HStack>
      </HStack>
      <VStack align="stretch" gap={2}>
        <ButtonGroup size="sm" attached>
          <Button colorScheme={isMute ? 'red' : 'gray'} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMute(v => !v); }}>{t('player.mute')}</Button>
          <Button colorScheme={isSolo ? 'green' : 'gray'} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSolo(v => !v); }}>{t('player.solo')}</Button>
        </ButtonGroup>
        <HStack>
          <Text w="20px" textAlign="center">🔊</Text>
          <Slider.Root min={0} max={16} value={[volume]} onValueChange={(details) => setVolume(details.value[0])} flex="1">
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumbs />
            </Slider.Control>
          </Slider.Root>
          <Text w="24px" textAlign="center" fontSize="sm">{volume}</Text>
        </HStack>
      </VStack>
    </Box>
  );
};
