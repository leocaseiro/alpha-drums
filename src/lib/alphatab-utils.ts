import * as alphaTab from '@coderline/alphatab';
import { IEventEmitter, IEventEmitterOfT } from '@coderline/alphatab';
import React from 'react';


// Resolve basePath configured for GitHub Pages (from next.config.ts)
const NEXT_PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

// Build a public URL that respects basePath
const resolvePublicUrl = (relativePath: string): string => {
  const basePath = NEXT_PUBLIC_BASE_PATH || '';
  const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const normalizedRel = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${normalizedBase}${normalizedRel}`;
};

// Ensure AlphaTab resolves worker and font over HTTP (prevents file:// in dev)
if (typeof window !== 'undefined') {
  try {
    (alphaTab as unknown as { Environment?: { scriptFile: string; fontDirectory: string } }).Environment!.scriptFile = '/alphaTab.worker.mjs';
    (alphaTab as unknown as { Environment?: { scriptFile: string; fontDirectory: string } }).Environment!.fontDirectory = '/font/';
  } catch {
    // ignore if not writable in this build
  }
}

export const openFile = (api: alphaTab.AlphaTabApi, file: File) => {
  if (!api || !api.load) {
    console.error('AlphaTab API not properly initialized');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const arrayBuffer = e.target?.result as ArrayBuffer;
    if (arrayBuffer) {
      try {
        api.load(arrayBuffer);
      } catch (error) {
        console.error('Failed to load file:', error);
      }
    }
  };
  reader.onerror = () => {
    console.error('Failed to read file');
  };
  reader.readAsArrayBuffer(file);
};

export const useAlphaTab = (settingsSetup?: (settings: alphaTab.Settings) => void) => {
  const [api, setApi] = React.useState<alphaTab.AlphaTabApi | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (elementRef.current && !api) {
      const settings = new alphaTab.Settings();

      // Configure asset paths (respecting basePath)
      settings.core.fontDirectory = resolvePublicUrl('/font/');
      settings.core.scriptFile = resolvePublicUrl('/alphaTab.worker.mjs');
      settings.core.engine = 'svg';

      // Always use workers; path points to public worker
      settings.core.useWorkers = true;

      // But enable the player anyway for basic functionality
      settings.player.enablePlayer = true;
      // Ensure soundfont is available for audio playback
      // Try sf3 first, fallback to sf2
      settings.player.soundFont = resolvePublicUrl('/soundfont/sonivox.sf3');
      if (process.env.NODE_ENV !== 'production') {
        // Prefer legacy script processor in dev to avoid worklet constraints
        settings.player.outputMode = alphaTab.PlayerOutputMode.WebAudioScriptProcessor;
      }

      console.log('AlphaTab settings:', {
        fontDirectory: settings.core.fontDirectory,
        scriptFile: settings.core.scriptFile,
        useWorkers: settings.core.useWorkers,
        soundFont: settings.player.soundFont,
        basePath: NEXT_PUBLIC_BASE_PATH
      });

      // Verify worker file is accessible
      if (typeof window !== 'undefined') {
        fetch(settings.core.scriptFile, { method: 'HEAD' })
          .then(response => {
            console.log('Worker file accessibility check:', response.status === 200 ? 'OK' : 'FAILED');
          })
          .catch(error => {
            console.error('Worker file accessibility check failed:', error);
          });
      }

      if (settingsSetup) {
        settingsSetup(settings);
      }

      try {
        console.log('Creating AlphaTab API with settings:', {
          scriptFile: settings.core.scriptFile,
          useWorkers: settings.core.useWorkers,
          fontDirectory: settings.core.fontDirectory
        });

        const alphaTabApi = new alphaTab.AlphaTabApi(elementRef.current, settings);

        // Ensure the worker path is correct after creation
        if (alphaTabApi.settings && alphaTabApi.settings.core && alphaTabApi.settings.core.useWorkers) {
          alphaTabApi.settings.core.scriptFile = resolvePublicUrl('/alphaTab.worker.mjs');
          console.log('Forced worker path to:', alphaTabApi.settings.core.scriptFile);
        }

        // Trigger soundfont loading explicitly
        try {
          alphaTabApi.loadSoundFontFromUrl(resolvePublicUrl('/soundfont/sonivox.sf3'), false);
        } catch (e) {
          console.warn('SoundFont load trigger failed (sf3), trying sf2:', e);
          try {
            alphaTabApi.loadSoundFontFromUrl(resolvePublicUrl('/soundfont/sonivox.sf2'), false);
          } catch (e2) {
            console.warn('SoundFont load trigger failed (sf2):', e2);
          }
        }

        // Wait for AlphaTab to be properly initialized
        const initTimeout = setTimeout(() => {
          console.log('AlphaTab initialized, checking API...');

          // Check if the API has the required methods and event system
          if (alphaTabApi &&
              typeof alphaTabApi.load === 'function' &&
              alphaTabApi.scoreLoaded &&
              typeof alphaTabApi.scoreLoaded.on === 'function') {
            setApi(alphaTabApi);
            setIsReady(true);
            console.log('AlphaTab API is ready');
          } else {
            console.error('AlphaTab API not properly initialized - missing methods or events');
          }
        }, 500); // Give AlphaTab time to initialize

        return () => {
          clearTimeout(initTimeout);
          if (alphaTabApi && typeof alphaTabApi.destroy === 'function') {
            alphaTabApi.destroy();
          }
          setApi(null);
          setIsReady(false);
        };
      } catch (error) {
        console.error('Failed to initialize AlphaTab:', error);
      }
    }
  }, []);

  return [api, elementRef, isReady] as const;
};

export const useAlphaTabEvent = (
  api: alphaTab.AlphaTabApi | null,
  event: string,
  handler: (...args: unknown[]) => void
) => {
  React.useEffect(() => {
    if (api) {
      try {
        // Use the proper AlphaTab event system with .on() method
        const eventEmitter = api[event as keyof alphaTab.AlphaTabApi] as Partial<IEventEmitter> | Partial<IEventEmitterOfT<unknown>> | undefined;
        if (eventEmitter && typeof eventEmitter.on === 'function') {
          eventEmitter.on(handler);
          return () => {
            if (typeof eventEmitter.off === 'function') {
              eventEmitter.off(handler);
            }
          };
        } else {
          console.warn(`Event ${event} not available or not properly initialized`);
        }
      } catch (error) {
        console.error(`Failed to attach event handler for ${event}:`, error);
      }
    }
  }, [api, event, handler]);
};
