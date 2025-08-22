import * as alphaTab from '@coderline/alphatab';
import React from 'react';

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
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (elementRef.current && !api) {
      const settings = new alphaTab.Settings();
      
      // Configure asset paths
      settings.core.fontDirectory = '/font/';
      settings.core.scriptFile = '/alphaTab.worker.mjs';
      
      if (settingsSetup) {
        settingsSetup(settings);
      }
      
      try {
        const alphaTabApi = new alphaTab.AlphaTabApi(elementRef.current, settings);
        
        // Set API immediately - it should be usable right after construction
        setApi(alphaTabApi);

        return () => {
          if (alphaTabApi && typeof alphaTabApi.destroy === 'function') {
            alphaTabApi.destroy();
          }
          setApi(null);
        };
      } catch (error) {
        console.error('Failed to initialize AlphaTab:', error);
      }
    }
  }, []);

  return [api, elementRef] as const;
};

export const useAlphaTabEvent = (
  api: alphaTab.AlphaTabApi | null,
  event: string,
  handler: (...args: unknown[]) => void
) => {
  React.useEffect(() => {
    if (api) {
      try {
        // Use the proper AlphaTab event system
        (api as any)[event] = handler;
        return () => {
          if (api) {
            delete (api as any)[event];
          }
        };
      } catch (error) {
        console.error(`Failed to attach event handler for ${event}:`, error);
      }
    }
  }, [api, event, handler]);
};