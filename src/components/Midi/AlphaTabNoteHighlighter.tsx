'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import * as alphaTab from '@coderline/alphatab';
import { useMidi } from '@/context/MidiContext';

interface NoteHighlight {
  id: string;
  noteElement: HTMLElement;
  timestamp: number;
  type: 'hit' | 'miss' | 'perfect' | 'good' | 'early' | 'late';
}

interface AlphaTabNoteHighlighterProps {
  api?: alphaTab.AlphaTabApi;
  enabled: boolean;
  gameMode?: boolean;
}

export function AlphaTabNoteHighlighter({ api, enabled, gameMode = false }: AlphaTabNoteHighlighterProps) {
  const { history } = useMidi();
  const activeHighlights = useRef<Map<string, NoteHighlight>>(new Map());
  const lastProcessedMessageRef = useRef<string>('');

  // Find note elements in the DOM that correspond to MIDI notes
  const findNoteElement = useCallback((midiNote: number): HTMLElement | null => {
    try {
      // Access the DOM container element directly from the page
      const container = document.querySelector('.at-viewport, .at-surface, [data-alphatab]');
      if (!container) return null;

      // Look for any note elements that we can highlight
      // Since AlphaTab's DOM structure can be complex, we'll look for common note selectors
      const selectors = [
        '.at-note-head',
        '.at-note',
        '.at-percussion-note',
        '[data-note]',
        '.at-beat .at-note-head',
        '.at-staff .at-note-head'
      ];

      for (const selector of selectors) {
        const elements = container.querySelectorAll(selector);
        if (elements.length > 0) {
          // For now, randomly select one of the available note elements
          // This provides visual feedback even if not perfectly mapped
          const randomIndex = Math.floor(Math.random() * Math.min(elements.length, 5));
          return elements[randomIndex] as HTMLElement;
        }
      }

      console.warn('No note elements found to highlight');
    } catch (error) {
      console.warn('Error finding note element:', error);
    }

    return null;
  }, []);

  // Apply visual highlighting to a note element
  const highlightNote = useCallback((element: HTMLElement, type: NoteHighlight['type']) => {
    const originalStyle = {
      backgroundColor: element.style.backgroundColor,
      border: element.style.border,
      borderRadius: element.style.borderRadius,
      boxShadow: element.style.boxShadow,
      transition: element.style.transition,
    };

    // Store original style for restoration
    if (!element.dataset.originalStyle) {
      element.dataset.originalStyle = JSON.stringify(originalStyle);
    }

    // Apply highlight based on type
    element.style.transition = 'all 0.2s ease';
    
    switch (type) {
      case 'hit':
      case 'perfect':
        element.style.backgroundColor = '#4ade80'; // green
        element.style.boxShadow = '0 0 10px #4ade80';
        break;
      case 'good':
        element.style.backgroundColor = '#3b82f6'; // blue
        element.style.boxShadow = '0 0 10px #3b82f6';
        break;
      case 'early':
        element.style.backgroundColor = '#f59e0b'; // yellow
        element.style.boxShadow = '0 0 10px #f59e0b';
        break;
      case 'late':
        element.style.backgroundColor = '#f97316'; // orange
        element.style.boxShadow = '0 0 10px #f97316';
        break;
      case 'miss':
        element.style.backgroundColor = '#ef4444'; // red
        element.style.boxShadow = '0 0 10px #ef4444';
        // Add a cross overlay for misses
        const cross = document.createElement('div');
        cross.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #ffffff;
          font-size: 16px;
          font-weight: bold;
          pointer-events: none;
          z-index: 1000;
        `;
        cross.textContent = '✗';
        cross.className = 'midi-miss-marker';
        element.style.position = 'relative';
        element.appendChild(cross);
        break;
    }

    element.style.border = '2px solid currentColor';
    element.style.borderRadius = '50%';
  }, []);

  // Remove highlighting from a note element
  const unhighlightNote = useCallback((element: HTMLElement) => {
    try {
      if (element.dataset.originalStyle) {
        const originalStyle = JSON.parse(element.dataset.originalStyle);
        Object.assign(element.style, originalStyle);
        delete element.dataset.originalStyle;
      }

      // Remove any miss markers
      const missMarkers = element.querySelectorAll('.midi-miss-marker');
      missMarkers.forEach(marker => marker.remove());
    } catch (error) {
      console.warn('Error removing highlight:', error);
    }
  }, []);

  // Process new MIDI messages for highlighting
  useEffect(() => {
    if (!enabled || !api || history.length === 0) return;

    const latestMessage = history[0];
    
    // Avoid processing the same message twice
    if (latestMessage.id === lastProcessedMessageRef.current) return;
    lastProcessedMessageRef.current = latestMessage.id;

    if (latestMessage.message.type === 'noteOn' && latestMessage.message.note !== undefined) {
      const noteElement = findNoteElement(latestMessage.message.note);
      
      if (noteElement) {
        const highlightType = gameMode ? 'hit' : 'hit'; // In game mode, this would be determined by timing accuracy
        const highlight: NoteHighlight = {
          id: latestMessage.id,
          noteElement,
          timestamp: latestMessage.timestamp,
          type: highlightType,
        };

        // Apply highlight
        highlightNote(noteElement, highlightType);
        activeHighlights.current.set(latestMessage.id, highlight);

        // Remove highlight after a delay
        setTimeout(() => {
          unhighlightNote(noteElement);
          activeHighlights.current.delete(latestMessage.id);
        }, gameMode ? 1000 : 500); // Longer highlight in game mode
      }
    }
  }, [history, enabled, api, gameMode, findNoteElement, highlightNote, unhighlightNote]);

  // Clean up highlights when component unmounts or API changes
  useEffect(() => {
    return () => {
      // Clear all active highlights
      activeHighlights.current.forEach(highlight => {
        unhighlightNote(highlight.noteElement);
      });
      activeHighlights.current.clear();
    };
  }, [api, unhighlightNote]);

  // This component doesn't render anything visible - it only adds behavior
  return null;
}