'use client';

import React, { useEffect, useState } from 'react';
import * as alphaTab from '@coderline/alphatab';
import { useI18n } from '@/app/i18n';
import { Box, HStack, VStack, Text, Slider, Switch, Button, ButtonGroup, Editable, IconButton } from '@chakra-ui/react';
import { toaster } from '@/app/toaster';
import { Tooltip } from '@/components/ui/Tooltip';

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
  const [showStandardNotation, setShowStandardNotation] = useState(true);
  const [showTablature, setShowTablature] = useState(true);
  const [showSlash, setShowSlash] = useState(false);
  const [showNumbered, setShowNumbered] = useState(false);

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

  useEffect(() => {
    // Apply stave profile per track based on individual toggles
    if (api && track) {
      try {
        let newProfile = alphaTab.StaveProfile.Score; // Default fallback
        
        if (showStandardNotation && showTablature) {
          newProfile = alphaTab.StaveProfile.ScoreTab;
        } else if (showStandardNotation) {
          newProfile = alphaTab.StaveProfile.Score;
        } else if (showTablature) {
          newProfile = alphaTab.StaveProfile.Tab;
        }
        
        // Update slash and numbered notation on all staves of this track
        track.staves.forEach((stave) => {
          stave.showSlash = showSlash;
          stave.showNumbered = showNumbered;
        });
        
        api.settings.display.staveProfile = newProfile;
        api.updateSettings();
        api.render();
      } catch (error) {
        console.warn('Could not update stave profile:', error);
      }
    }
  }, [api, track, showStandardNotation, showTablature, showSlash, showNumbered]);

  const getTrackIcon = () => {
    if (track.staves.some((s) => s.isPercussion)) {
      return '🥁';
    }
    return '🎸';
  };

  const handleShowToggle = (details: { checked: boolean }) => {
    if (onToggleShow) {
      onToggleShow(track);
      toaster.create({
        type: 'info',
        title: 'Track Visibility',
        description: `Track "${track.name}" ${details.checked ? 'shown' : 'hidden'}`
      });
    }
  };

  return (
    <Box borderWidth="1px" borderRadius="md" p={3} mb={2} bg="white" _hover={{ shadow: 'sm', borderColor: 'teal.400' }} borderColor={isSelected ? 'teal.400' : 'gray.200'}>
      <HStack gap={2} mb={2} align="center">
        <Text fontSize="lg" w="24px" textAlign="center">{getTrackIcon()}</Text>
        <Text flex="1" fontWeight="medium">{track.name}</Text>
      </HStack>
      <VStack align="stretch" gap={2}>
        <HStack gap={4} justify="center">
          <Tooltip ids={{ trigger: `mute-${track.index}` }} content={isMute ? 'Unmute' : 'Mute'}>
            <Switch.Root ids={{ root: `mute-${track.index}` }} checked={!isMute} onCheckedChange={() => {
              setMute(v => !v);
              toaster.create({ type: 'info', title: 'Track Mute', description: `Track "${track.name}" ${!isMute ? 'muted' : 'unmuted'}` });
            }}>
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Indicator fallback={<span>🔇</span>}>
                  <span>🔈</span>
                </Switch.Indicator>
              </Switch.Control>
            </Switch.Root>
          </Tooltip>
          <Tooltip ids={{ trigger: `solo-${track.index}` }} content={isSolo ? 'Listen with all tracks' : 'Listen solo'}>
            <Switch.Root ids={{ root: `solo-${track.index}` }} checked={isSolo} onCheckedChange={() => {
              setSolo(v => !v);
              toaster.create({ type: 'info', title: 'Track Solo', description: `Track "${track.name}" ${!isSolo ? 'soloed' : 'unsoloed'}` });
            }}>
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Indicator fallback={<span>📢</span>}>
                  <span>🎧</span>
                </Switch.Indicator>
              </Switch.Control>
            </Switch.Root>
          </Tooltip>
          <Tooltip ids={{ trigger: `show-${track.index}` }} content={isSelected ? 'Hide track' : 'Show track'}>
            <Switch.Root ids={{ root: `show-${track.index}` }} checked={isSelected} onCheckedChange={handleShowToggle}>
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Indicator fallback={<span>🫥</span>}>
                  <span>👁️</span>
                </Switch.Indicator>
              </Switch.Control>
            </Switch.Root>
          </Tooltip>
        </HStack>
        <VStack align="stretch" gap={2}>
          <ButtonGroup size="sm" attached>
            <Tooltip content="Toggle standard notation" showArrow>
              <Button
                variant={showStandardNotation ? 'surface' : 'outline'}
                colorScheme="teal"
                onClick={() => {
                  setShowStandardNotation(!showStandardNotation);
                  toaster.create({
                    type: 'info',
                    title: 'Notation Changed',
                    description: `Track "${track.name}" ${!showStandardNotation ? 'enabled' : 'disabled'} standard notation`
                  });
                }}
              >
                🎼
              </Button>
            </Tooltip>
            <Tooltip content="Toggle tablature" showArrow>
              <Button
                variant={showTablature ? 'surface' : 'outline'}
                colorScheme="teal"
                onClick={() => {
                  setShowTablature(!showTablature);
                  toaster.create({
                    type: 'info',
                    title: 'Notation Changed',
                    description: `Track "${track.name}" ${!showTablature ? 'enabled' : 'disabled'} tablature`
                  });
                }}
              >
                {track.staves.some((s) => s.isPercussion) ? '🥁' : '🎸'}
              </Button>
            </Tooltip>
            <Tooltip content="Toggle slash notation" showArrow>
              <Button 
                variant={showSlash ? 'surface' : 'outline'}
                colorScheme="teal"
                onClick={() => {
                  setShowSlash(!showSlash);
                  toaster.create({ 
                    type: 'info', 
                    title: 'Notation Changed', 
                    description: `Track "${track.name}" ${!showSlash ? 'enabled' : 'disabled'} slash notation` 
                  });
                }}
              >
                /
              </Button>
            </Tooltip>
            <Tooltip content="Toggle numbers" showArrow>
              <Button 
                variant={showNumbered ? 'surface' : 'outline'}
                colorScheme="teal"
                onClick={() => {
                  setShowNumbered(!showNumbered);
                  toaster.create({ 
                    type: 'info', 
                    title: 'Notation Changed', 
                    description: `Track "${track.name}" ${!showNumbered ? 'enabled' : 'disabled'} numbers` 
                  });
                }}
              >
                🔢
              </Button>
            </Tooltip>
          </ButtonGroup>
        </VStack>

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
          <Editable.Root 
            value={String(Math.round((volume / 16) * 100))} 
            onValueChange={(details) => {
              const value = Math.max(0, Math.min(100, Number(details.value) || 100));
              setVolume((value / 100) * 16);
            }}
          >
            <Editable.Preview fontSize="sm" minW="30px" textAlign="center" />
            <Editable.Input fontSize="sm" minW="30px" textAlign="center" />
          </Editable.Root>
          <Text fontSize="sm">%</Text>
          <IconButton 
            aria-label="Reset volume" 
            size="xs" 
            variant="ghost" 
            onClick={() => setVolume(16)}
          >
            🔄
          </IconButton>
        </HStack>
      </VStack>
    </Box>
  );
};
