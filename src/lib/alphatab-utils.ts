import * as alphaTab from '@coderline/alphatab';
import React from 'react';

export const openFile = (api: alphaTab.AlphaTabApi, file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const arrayBuffer = e.target?.result as ArrayBuffer;
    if (arrayBuffer) {
      api.load(arrayBuffer);
    }
  };
  reader.readAsArrayBuffer(file);
};

export const useAlphaTab = (settingsSetup?: (settings: alphaTab.Settings) => void) => {
  const [api, setApi] = React.useState<alphaTab.AlphaTabApi | null>(null);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (elementRef.current && !api) {
      const settings = new alphaTab.Settings();
      
      if (settingsSetup) {
        settingsSetup(settings);
      }
      
      const alphaTabApi = new alphaTab.AlphaTabApi(elementRef.current, settings);
      setApi(alphaTabApi);

      return () => {
        alphaTabApi.destroy();
        setApi(null);
      };
    }
  }, []); // Remove settingsSetup from dependencies to prevent infinite loop

  return [api, elementRef] as const;
};

export const useAlphaTabEvent = (
  api: alphaTab.AlphaTabApi | null,
  event: string,
  handler: (...args: unknown[]) => void
) => {
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  React.useEffect(() => {
    if (api) {
      const stableHandler = (...args: unknown[]) => handlerRef.current(...args);
      (api as unknown as Record<string, unknown>)[event] = stableHandler;
      return () => {
        delete (api as unknown as Record<string, unknown>)[event];
      };
    }
  }, [api, event]); // Remove handler from dependencies
};