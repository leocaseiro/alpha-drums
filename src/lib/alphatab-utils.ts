import * as alphaTab from '@coderline/alphatab';
import React from 'react';

// Try to set global worker path
if (typeof window !== 'undefined') {
  const baseUrl = window.location.origin;
  
  // Set global AlphaTab configuration if available
  if ((alphaTab as any).Environment) {
    console.log('Setting global AlphaTab environment...');
    (alphaTab as any).Environment.scriptFile = `${baseUrl}/alphaTab.worker.mjs`;
    (alphaTab as any).Environment.fontDirectory = `${baseUrl}/font/`;
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
      
      // Configure asset paths
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      settings.core.fontDirectory = `${baseUrl}/font/`;
      settings.core.scriptFile = `${baseUrl}/alphaTab.worker.mjs`;
      
      // Temporarily disable workers until we fix the path issue
      settings.core.useWorkers = false;
      
      // But enable the player anyway for basic functionality
      settings.player.enablePlayer = true;
      
      console.log('AlphaTab settings:', {
        fontDirectory: settings.core.fontDirectory,
        scriptFile: settings.core.scriptFile,
        useWorkers: settings.core.useWorkers,
        baseUrl: baseUrl
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
        
        // Force the worker path after creation
        if (alphaTabApi.settings && alphaTabApi.settings.core) {
          alphaTabApi.settings.core.scriptFile = `${baseUrl}/alphaTab.worker.mjs`;
          console.log('Forced worker path to:', alphaTabApi.settings.core.scriptFile);
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