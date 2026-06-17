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

// Register our own AlphaTab worker/worklet factory.
//
// AlphaTab's built-in bootstrap constructs the worker as
// `new Worker(new URL('./alphaTab.worker.mjs', import.meta.url))` *inside its
// own pre-bundled module*. Next bakes that `import.meta.url` to a build-time
// file:// path (e.g. file:///vercel/path0/.../alphaTab.worker.mjs), which the
// browser refuses to load ("Not allowed to load local resource"). The official
// @coderline/alphatab-webpack plugin can't rewrite that indirect construction
// under Next either. By calling the *direct* `new Worker(new URL(...))` form
// from our own module, Next/webpack recognizes it and emits a real, hashed
// worker chunk under /_next/ — so the worker loads over HTTP on Vercel and,
// via webpack's public path, under the basePath on GitHub Pages.
if (typeof window !== 'undefined') {
  try {
    alphaTab.Environment.initializeMain(
      // Worker: let webpack bundle our worker entry into a hashed /_next/ chunk.
      // The `new Worker(new URL('./relative', import.meta.url))` form is the
      // pattern Next/webpack recognizes and rewrites to a real served URL.
      () =>
        new Worker(new URL('./alphatab.worker.ts', import.meta.url), {
          type: 'module',
        }),
      // Audio worklet: this app forces PlayerOutputMode.WebAudioScriptProcessor
      // (below + in the player config), so this factory is not exercised. We
      // point it at the ESM worklet shipped in public/ as a best-effort for any
      // future AudioWorklet output mode; webpack cannot bundle worklets the way
      // it bundles workers, so a served URL is the correct shape here.
      (context) => context.audioWorklet.addModule(resolvePublicUrl('/alphaTab.worklet.mjs')),
    );
  } catch (e) {
    console.error('Failed to register AlphaTab worker factory:', e);
  }
}

export const openFile = (api: alphaTab.AlphaTabApi, file: File) => {
  if (!api || !api.load) {
    console.error('AlphaTab API not properly initialized');
    return;
  }

  console.log(`Reading file: ${file.name} (${file.size} bytes, type: ${file.type})`);

  const reader = new FileReader();
  reader.onload = (e) => {
    const arrayBuffer = e.target?.result as ArrayBuffer;
    if (arrayBuffer) {
      try {
        console.log(`Loading ${arrayBuffer.byteLength} bytes into AlphaTab`);
        api.load(arrayBuffer);
      } catch (error) {
        console.error('Failed to load file into AlphaTab:', error);
        // The error will be caught by the 'error' event listener in the component
      }
    }
  };
  reader.onerror = (error) => {
    console.error('Failed to read file:', error);
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
        basePath: NEXT_PUBLIC_BASE_PATH,
      });

      // Verify worker file is accessible
      if (typeof window !== 'undefined') {
        fetch(settings.core.scriptFile, { method: 'HEAD' })
          .then((response) => {
            console.log(
              'Worker file accessibility check:',
              response.status === 200 ? 'OK' : 'FAILED',
            );
          })
          .catch((error) => {
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
          fontDirectory: settings.core.fontDirectory,
        });

        const alphaTabApi = new alphaTab.AlphaTabApi(elementRef.current, settings);

        // Ensure the worker path is correct after creation
        if (
          alphaTabApi.settings &&
          alphaTabApi.settings.core &&
          alphaTabApi.settings.core.useWorkers
        ) {
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
          if (
            alphaTabApi &&
            typeof alphaTabApi.load === 'function' &&
            alphaTabApi.scoreLoaded &&
            typeof alphaTabApi.scoreLoaded.on === 'function'
          ) {
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
  handler: (...args: unknown[]) => void,
) => {
  // Keep the latest handler in a ref so the subscription stays stable across
  // renders. Handlers are defined inline at call sites, so their identity
  // changes every render; depending on `handler` here would off()/on() the
  // event on every render. AlphaTab's `scoreLoaded` emitter *replays* its
  // current value to each new subscriber (fireOnRegister), so re-subscribing
  // every render re-fired `scoreLoaded` repeatedly — which left the loading
  // overlay stuck at 30% ("Processing score...") because the last replay reset
  // isLoading=true after rendering had already finished. Subscribe once per
  // (api, event) instead and always invoke the current handler via the ref.
  const handlerRef = React.useRef(handler);
  React.useEffect(() => {
    handlerRef.current = handler;
  });

  React.useEffect(() => {
    if (!api) return;
    try {
      // Use the proper AlphaTab event system with .on() method
      const eventEmitter = api[event as keyof alphaTab.AlphaTabApi] as
        | Partial<IEventEmitter>
        | Partial<IEventEmitterOfT<unknown>>
        | undefined;
      if (eventEmitter && typeof eventEmitter.on === 'function') {
        const stableHandler = (...args: unknown[]) => handlerRef.current(...args);
        eventEmitter.on(stableHandler);
        return () => {
          if (typeof eventEmitter.off === 'function') {
            eventEmitter.off(stableHandler);
          }
        };
      } else {
        console.warn(`Event ${event} not available or not properly initialized`);
      }
    } catch (error) {
      console.error(`Failed to attach event handler for ${event}:`, error);
    }
  }, [api, event]);
};
