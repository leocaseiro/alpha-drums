'use client';

import React, { useEffect, useState } from 'react';
import * as alphaTab from '@coderline/alphatab';
import { useI18n } from '@/app/i18n';
import { Box, HStack, VStack, Text, Slider, Switch, Select, createListCollection } from '@chakra-ui/react';
import { toaster } from '@/app/toaster';
import { Tooltip } from '../ui/Tooltip';

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
  const [staveProfile, setStaveProfile] = useState<number>(alphaTab.StaveProfile.ScoreTab);

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
    // Apply stave profile per track
    if (api && track) {
      try {
        // Update track settings and re-render
        api.settings.display.staveProfile = staveProfile as alphaTab.StaveProfile;
        api.updateSettings();
        api.render();
      } catch (error) {
        console.warn('Could not update stave profile:', error);
      }
    }
  }, [api, track, staveProfile]);

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
    <Box borderWidth="1px" borderRadius="md" p={3} mb={2} bg="white" _hover={{ shadow: 'sm', borderColor: 'blue.400' }} borderColor={isSelected ? 'blue.400' : 'gray.200'}>
      <HStack gap={2} mb={2} align="center">
        <Text fontSize="lg" w="24px" textAlign="center">{getTrackIcon()}</Text>
        <Text flex="1" fontWeight="medium">{track.name}</Text>
      </HStack>
      <VStack align="stretch" gap={2}>
        <HStack gap={4} justify="center">
          <Tooltip ids={{ trigger: `show-${track.index}` }} content={t('player.showTrack') || 'Show/Hide Track'}>
            <Switch.Root ids={{ root: `show-${track.index}` }} checked={isSelected} onCheckedChange={handleShowToggle}>
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Indicator fallback={<span>🫥</span>}>
                  <span>👁️</span>
                </Switch.Indicator>
              </Switch.Control>
            </Switch.Root>
          </Tooltip>
          <Tooltip ids={{ trigger: `mute-${track.index}` }} content={t('player.mute') || 'Mute Track'}>
            <Switch.Root ids={{ root: `mute-${track.index}` }} checked={isMute} onCheckedChange={() => {
              setMute(v => !v);
              toaster.create({ type: 'info', title: 'Track Mute', description: `Track "${track.name}" ${!isMute ? 'muted' : 'unmuted'}` });
            }}>
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Indicator fallback={<span>🔈</span>}>
                  <span>🔇</span>
                </Switch.Indicator>
              </Switch.Control>
            </Switch.Root>
          </Tooltip>
          <Tooltip ids={{ trigger: `solo-${track.index}` }} content={t('player.solo') || 'Solo Track'}>
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
        </HStack>
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

        <VStack align="stretch" gap={2}>
          <Text fontSize="xs" color="gray.600">{t('player.staveProfile') || 'Stave Profile'}</Text>
          <Select.Root
            collection={createListCollection({
              items: [
                { label: "Score", value: alphaTab.StaveProfile.Score },
                { label: "Tab", value: alphaTab.StaveProfile.Tab },
                { label: "Score + Tab", value: alphaTab.StaveProfile.ScoreTab },
              ],
            })}
            defaultValue={[staveProfile.toString()]}
            onValueChange={(e) => setStaveProfile(Number(e.value[0]))}
            size="sm"
          >
            <Select.Trigger>
              <Select.ValueText placeholder={[
                { label: "Score", value: alphaTab.StaveProfile.Score },
                { label: "Tab", value: alphaTab.StaveProfile.Tab },
                { label: "Score + Tab", value: alphaTab.StaveProfile.ScoreTab },
              ].find(item => item.value === staveProfile)?.label || 'Select Stave Profile'} />
            </Select.Trigger>
            <Select.Content>
              {[
                { label: "Score", value: alphaTab.StaveProfile.Score },
                { label: "Tab", value: alphaTab.StaveProfile.Tab },
                { label: "Score + Tab", value: alphaTab.StaveProfile.ScoreTab },
              ].map((profile) => (
                <Select.Item item={profile} key={profile.value}>
                  {profile.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </VStack>
      </VStack>
    </Box>
  );
};
