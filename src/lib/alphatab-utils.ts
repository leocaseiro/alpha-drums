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
    if (elementRef.current) {
      const settings = new alphaTab.Settings();
      if (settingsSetup) {
        settingsSetup(settings);
      }
      
      const alphaTabApi = new alphaTab.AlphaTabApi(elementRef.current, settings);
      setApi(alphaTabApi);

      return () => {
        alphaTabApi.destroy();
      };
    }
  }, [settingsSetup]);

  return [api, elementRef] as const;
};

export const useAlphaTabEvent = (
  api: alphaTab.AlphaTabApi | null,
  event: string,
  handler: (...args: unknown[]) => void
) => {
  React.useEffect(() => {
    if (api) {
      (api as unknown as Record<string, unknown>)[event] = handler;
      return () => {
        delete (api as unknown as Record<string, unknown>)[event];
      };
    }
  }, [api, event, handler]);
};