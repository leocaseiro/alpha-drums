'use client';

import React, { useEffect, useState } from 'react';
import * as alphaTab from '@coderline/alphatab';
import { useI18n } from '@/app/i18n';
import styles from './TrackItem.module.css';

export interface TrackItemProps {
  api: alphaTab.AlphaTabApi;
  track: alphaTab.model.Track;
  isSelected: boolean;
  onToggleShow?: (track: alphaTab.model.Track) => void;
}

export const TrackItem: React.FC<TrackItemProps> = ({
  api,
  track,
  isSelected,
  onToggleShow,
}) => {
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

  const handleShowToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleShow) {
      onToggleShow(track);
    }
  };

  return (
    <div className={`${styles.track} ${isSelected ? styles.active : ''}`}>
      <div className={styles.trackHeader}>
        <div className={styles.trackIcon}>
          {getTrackIcon()}
        </div>
        <span className={styles.trackName}>{track.name}</span>
        <button
          type="button"
          onClick={handleShowToggle}
          className={`${styles.showButton} ${isSelected ? styles.showButtonActive : ''}`}
          title={t('player.showTrack')}
        >
          👁️
        </button>
      </div>
      
      <div className={styles.trackControls}>
        <div className={styles.buttonGroup}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMute((v) => !v);
            }}
            className={`${styles.controlButton} ${styles.muteButton} ${
              isMute ? styles.active : ''
            }`}
            title={t('player.mute')}
          >
            {t('player.mute')}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSolo((v) => !v);
            }}
            className={`${styles.controlButton} ${styles.soloButton} ${
              isSolo ? styles.active : ''
            }`}
            title={t('player.solo')}
          >
            {t('player.solo')}
          </button>
        </div>
        
        <div className={styles.volumeControl}>
          <span className={styles.volumeIcon}>🔊</span>
          <input
            type="range"
            min="0"
            max="16"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={styles.volumeSlider}
            title={`${t('player.volume')}: ${volume}`}
          />
          <span className={styles.volumeValue}>{volume}</span>
        </div>
      </div>
    </div>
  );
};