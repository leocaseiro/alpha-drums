'use client';

import React, { useState, useCallback } from 'react';
import * as alphaTab from '@coderline/alphatab';
import { useAlphaTab, useAlphaTabEvent, openFile } from '@/lib/alphatab-utils';
import { useI18n } from '@/app/i18n';
import { TrackItem } from './TrackItem';
import { PlayerControls } from './PlayerControls';
import styles from './styles.module.css';

export const AlphaTabPlayer: React.FC = () => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false); // Start as false - only show when actually loading
  const [score, setScore] = useState<alphaTab.model.Score>();
  const [selectedTracks, setSelectedTracks] = useState(new Map<number, alphaTab.model.Track>());
  
  const settingsSetup = useCallback((settings: alphaTab.Settings) => {
    settings.player.playerMode = alphaTab.PlayerMode.EnabledSynthesizer;
    settings.player.scrollMode = alphaTab.ScrollMode.Continuous;
    settings.display.scale = 0.8;
  }, []);

  const [api, element] = useAlphaTab(settingsSetup);

  // Show loading when file starts loading
  useAlphaTabEvent(api, 'scoreLoaded', (loadedScore) => {
    setIsLoading(true); // Start loading when score is loaded and rendering begins
    setScore(loadedScore as alphaTab.model.Score);
  });

  useAlphaTabEvent(api, 'renderStarted', () => {
    // Set up initial track selection
    const trackMap = new Map<number, alphaTab.model.Track>();
    api!.tracks.forEach((track) => {
      trackMap.set(track.index, track);
    });
    setSelectedTracks(trackMap);
    // Keep loading state as true during rendering
  });

  useAlphaTabEvent(api, 'renderFinished', () => {
    setIsLoading(false);
  });

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && api && api.load) {
      setIsLoading(true); // Show loading immediately when file is selected
      setScore(undefined); // Clear previous score
      openFile(api, file);
    } else if (file && !api) {
      console.error('AlphaTab API not ready yet');
      alert('Player is still initializing, please wait a moment and try again.');
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
    if (files.length === 1 && api && api.load) {
      setIsLoading(true); // Show loading immediately when file is dropped
      setScore(undefined); // Clear previous score
      openFile(api, files[0]);
    } else if (files.length === 1 && !api) {
      console.error('AlphaTab API not ready yet');
      alert('Player is still initializing, please wait a moment and try again.');
    }
  };

  return (
    <div className={styles.container}>
      {isLoading && (
        <div className={styles.overlay}>
          <div className={styles.overlayContent}>
            <div className={styles.spinner}>Loading...</div>
          </div>
        </div>
      )}

      {!score && (
        <div 
          className={styles.fileInput}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className={styles.fileInputContent}>
            <h2>{t('player.loadFile')}</h2>
            <p>{t('player.dragDropFile')}</p>
            <input
              type="file"
              accept=".gp,.gp3,.gp4,.gp5,.gpx,.musicxml,.mxml,.xml,.capx"
              onChange={handleFileInput}
              className={styles.hiddenInput}
              id="file-input"
            />
            <label htmlFor="file-input" className={styles.fileButton}>
              {t('player.openFile')}
            </label>
          </div>
        </div>
      )}

      <div className={styles.content}>
        {score && (
          <div className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>{t('player.tracks')}</h3>
            <div className={styles.trackList}>
              {score.tracks.map((track) => (
                <TrackItem
                  key={track.index}
                  api={api!}
                  track={track}
                  isSelected={selectedTracks.has(track.index)}
                  onToggleShow={handleToggleTrack}
                />
              ))}
            </div>
          </div>
        )}
        
        <div className={styles.alphaTab} ref={element} />
      </div>

      {api && score && <PlayerControls api={api} />}
    </div>
  );
};