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
  const [isReady, setIsReady] = React.useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (elementRef.current && !api) {
      const settings = new alphaTab.Settings();
      
      // Configure asset paths - AlphaTab needs relative paths from the root
      settings.core.fontDirectory = '/font/';
      settings.core.scriptFile = '/alphaTab.worker.mjs';
      
      // Disable worker for now to see if that fixes rendering
      settings.core.useWorkers = false;
      
      console.log('AlphaTab settings:', {
        fontDirectory: settings.core.fontDirectory,
        scriptFile: settings.core.scriptFile,
        useWorkers: settings.core.useWorkers
      });
      
      if (settingsSetup) {
        settingsSetup(settings);
      }
      
      try {
        const alphaTabApi = new alphaTab.AlphaTabApi(elementRef.current, settings);
        
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
        const eventEmitter = (api as any)[event];
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