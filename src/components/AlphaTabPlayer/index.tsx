'use client';

import React, { useState } from 'react';
import * as alphaTab from '@coderline/alphatab';
import { useAlphaTab, useAlphaTabEvent, openFile } from '@/lib/alphatab-utils';
import { useI18n } from '@/app/i18n';
import styles from './styles.module.css';

export const AlphaTabPlayer: React.FC = () => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState<alphaTab.model.Score>();
  
  const [api, element] = useAlphaTab((settings) => {
    settings.player.playerMode = alphaTab.PlayerMode.EnabledSynthesizer;
    settings.player.scrollMode = alphaTab.ScrollMode.Continuous;
    settings.display.scale = 0.8;
  });

  useAlphaTabEvent(api, 'renderStarted', () => {
    setScore(api!.score!);
    setIsLoading(true);
  });

  useAlphaTabEvent(api, 'renderFinished', () => {
    setIsLoading(false);
  });

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && api) {
      openFile(api, file);
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
    if (files.length === 1 && api) {
      openFile(api, files[0]);
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

      <div className={styles.alphaTab} ref={element} />
    </div>
  );
};