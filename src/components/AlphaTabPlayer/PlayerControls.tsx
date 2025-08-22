'use client';

import React, { useEffect, useState } from 'react';
import * as alphaTab from '@coderline/alphatab';
import { useAlphaTabEvent } from '@/lib/alphatab-utils';
import { useI18n } from '@/app/i18n';
import styles from './PlayerControls.module.css';

export interface PlayerControlsProps {
  api: alphaTab.AlphaTabApi;
  onOpenFileClick: () => void;
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
          onClick={() => {
            console.log('Stop button clicked');
            try {
              api.stop();
            } catch (error) {
              console.warn('Stop failed, using fallback:', error);
              setIsPlaying(false);
            }
          }}
          disabled={!isReadyForPlayback}
          className={styles.controlButton}
          title={t('player.stop')}
        >
          ⏹️
        </button>

        <button
          onClick={() => {
            try {
              // Resume audio context on user gesture
              try { (api.player as unknown as { activate?: () => void })?.activate?.(); } catch {}
              if (!api.isReadyForPlayback) {
                console.log('Not ready for playback, attempting to load soundfont...');
                try { api.loadSoundFontFromUrl('/soundfont/sonivox.sf3', false); } catch {}
                try { api.loadSoundFontFromUrl('/soundfont/sonivox.sf2', false); } catch {}
              }
              api.playPause();
            } catch (error) {
              console.warn('PlayPause failed, using fallback simulation:', error);
              setIsPlaying(!isPlaying);
            }
          }}
          disabled={!isReadyForPlayback}
          className={`${styles.controlButton} ${styles.playButton}`}
          title={isPlaying ? t('player.pause') : t('player.play')}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <div className={styles.speedControl}>
          <label className={styles.speedLabel}>
            {t('player.speed')}: {Math.round(playbackSpeed * 100)}%
            {baseTempoBpm ? ` • ${Math.round(baseTempoBpm * playbackSpeed)} BPM` : ''}
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

        <div className={styles.zoomControl}>
          <label className={styles.zoomLabel}>
            🔍 {t('player.zoom')}: {zoom}%
          </label>
          <input
            type="range"
            min="25"
            max="200"
            step="5"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className={styles.zoomSlider}
          />
        </div>
      </div>

      {/* Toggle controls */}
      <div className={styles.toggleControls}>
        <input
          type="file"
          accept=".gp,.gp3,.gp4,.gp5,.gpx,.musicxml,.mxml,.xml,.capx"
          onChange={onOpenFileClick}
          className={styles.hiddenInput}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className={styles.fileButton}
          title={t('player.openFile')}
        >
          🔍
        </label>
        <button
          onClick={() => setIsLooping(!isLooping)}
          disabled={!isReadyForPlayback}
          className={`${styles.toggleButton} ${isLooping ? styles.active : ''}`}
          title={t('player.loop')}
        >
          🔁 {t('player.loop')}
        </button>

        <div className={styles.metronomeControl}>
          <button
            onClick={() => setIsMetronomeActive(!isMetronomeActive)}
            disabled={!isReadyForPlayback}
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
          {isMetronomeActive && (
            <span className={styles.volumeLabel}>{Math.round(metronomeVolume * 100)}%</span>
          )}
        </div>

        <div className={styles.countInControl}>
          <button
            onClick={() => setIsCountInActive(!isCountInActive)}
            disabled={!isReadyForPlayback}
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
          {isCountInActive && (
            <span className={styles.volumeLabel}>{Math.round(countInVolume * 100)}%</span>
          )}
        </div>

        <div className={styles.layoutControl}>
          <label className={styles.layoutLabel}>📄 {t('player.layout')}:</label>
          <select
            value={layoutMode}
            onChange={(e) => setLayoutMode(Number(e.target.value) as alphaTab.LayoutMode)}
            className={styles.layoutSelect}
          >
            <option value={alphaTab.LayoutMode.Page}>{t('player.page')}</option>
            <option value={alphaTab.LayoutMode.Horizontal}>{t('player.horizontal')}</option>
          </select>
        </div>

        <div className={styles.exportControls}>
          <button
            onClick={() => handleExport('gp')}
            disabled={!isReadyForPlayback}
            className={styles.exportButton}
            title={t('player.export')}
          >
            💾 {t('player.export')}
          </button>

          <button
            onClick={() => handlePrint()}
            disabled={!isReadyForPlayback}
            className={styles.exportButton}
            title={t('player.print')}
          >
            🖨️ {t('player.print')}
          </button>
        </div>
      </div>
    </div>
  );
};
