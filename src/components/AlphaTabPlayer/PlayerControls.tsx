'use client';

import React, { useEffect, useState } from 'react';
import * as alphaTab from '@coderline/alphatab';
import { useAlphaTabEvent } from '@/lib/alphatab-utils';
import { useI18n } from '@/app/i18n';
import styles from './PlayerControls.module.css';

export interface PlayerControlsProps {
  api: alphaTab.AlphaTabApi;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({ api }) => {
  const { t } = useI18n();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [isCountInActive, setIsCountInActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [endTime, setEndTime] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [metronomeVolume, setMetronomeVolume] = useState(1);
  const [countInVolume, setCountInVolume] = useState(1);

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

  return (
    <div className={styles.playerControls}>
      {/* Progress bar */}
      <div className={styles.progressSection}>
        <span className={styles.timeDisplay}>
          {formatDuration(currentTime)} / {formatDuration(endTime)}
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={endTime > 0 ? (currentTime / endTime) * 100 : 0}
          onChange={handleSeek}
          className={styles.progressSlider}
        />
      </div>

      {/* Main playback controls */}
      <div className={styles.playbackControls}>
        <button
          onClick={() => api.stop()}
          disabled={!api.isReadyForPlayback}
          className={styles.controlButton}
          title={t('player.stop')}
        >
          ⏹️
        </button>
        
        <button
          onClick={() => api.playPause()}
          disabled={!api.isReadyForPlayback}
          className={`${styles.controlButton} ${styles.playButton}`}
          title={isPlaying ? t('player.pause') : t('player.play')}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <div className={styles.speedControl}>
          <label className={styles.speedLabel}>
            {t('player.speed')}: {Math.round(playbackSpeed * 100)}%
          </label>
          <input
            type="range"
            min="0.25"
            max="2"
            step="0.05"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className={styles.speedSlider}
          />
        </div>
      </div>

      {/* Toggle controls */}
      <div className={styles.toggleControls}>
        <button
          onClick={() => setIsLooping(!isLooping)}
          disabled={!api.isReadyForPlayback}
          className={`${styles.toggleButton} ${isLooping ? styles.active : ''}`}
          title={t('player.loop')}
        >
          🔁 {t('player.loop')}
        </button>

        <div className={styles.metronomeControl}>
          <button
            onClick={() => setIsMetronomeActive(!isMetronomeActive)}
            disabled={!api.isReadyForPlayback}
            className={`${styles.toggleButton} ${isMetronomeActive ? styles.active : ''}`}
            title={t('player.metronome')}
          >
            🎼 {t('player.metronome')}
          </button>
          {isMetronomeActive && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={metronomeVolume}
              onChange={(e) => setMetronomeVolume(Number(e.target.value))}
              className={styles.volumeSlider}
              title={`${t('player.volume')}: ${Math.round(metronomeVolume * 100)}%`}
            />
          )}
        </div>

        <div className={styles.countInControl}>
          <button
            onClick={() => setIsCountInActive(!isCountInActive)}
            disabled={!api.isReadyForPlayback}
            className={`${styles.toggleButton} ${isCountInActive ? styles.active : ''}`}
            title={t('player.countIn')}
          >
            ⏳ {t('player.countIn')}
          </button>
          {isCountInActive && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={countInVolume}
              onChange={(e) => setCountInVolume(Number(e.target.value))}
              className={styles.volumeSlider}
              title={`${t('player.volume')}: ${Math.round(countInVolume * 100)}%`}
            />
          )}
        </div>
      </div>
    </div>
  );
};