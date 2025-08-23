/**
 * Debug logging utility that only logs when debug=1 is in URL parameters
 */

let isDebugMode: boolean | null = null;

function checkDebugMode(): boolean {
  if (isDebugMode === null) {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      isDebugMode = urlParams.get('debug') === '1';
    } else {
      isDebugMode = false;
    }
  }
  return isDebugMode;
}

export const debugLog = {
  log: (...args: unknown[]) => {
    if (checkDebugMode()) {
      console.log(...args);
    }
  },
  
  // Always allow errors and warnings
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
  
  // Debug-only info
  info: (...args: unknown[]) => {
    if (checkDebugMode()) {
      console.info(...args);
    }
  },

  // Debug-only table
  table: (data: unknown) => {
    if (checkDebugMode()) {
      console.table(data);
    }
  },

  // Force refresh debug mode check (useful for dynamic changes)
  refreshDebugMode: () => {
    isDebugMode = null;
    return checkDebugMode();
  }
};