/**
 * Utilities for Guitar Pro / MusicXML file type handling
 */

export const GUITAR_PRO_SUPPORTED_EXTENSIONS = [
  'gp',
  'gp3',
  'gp4',
  'gp5',
  'gpx',
  'musicxml',
  'mxml',
  'xml',
  'capx',
] as const;

/**
 * MIME types that can plausibly be used by Guitar Pro / MusicXML files.
 * Note: Many mobile browsers provide empty or generic types; always fall back to extension checks.
 */
export const GUITAR_PRO_MIME_TYPES = [
  'application/*',
  'application/xml',
  'text/xml',
  // MusicXML registered types
  'application/vnd.recordare.musicxml+xml',
  'application/vnd.recordare.musicxml',
  // GPX (conflicts with GPS Exchange, but helps some pickers show files)
  'application/gpx+xml',
] as const;

/**
 * Accept attribute compatible with most browsers.
 * - On desktop: extensions are honored (native filtering)
 * - On iOS Safari: extensions are ignored, but `application/*` routes to Files provider
 * - On Android: helps open the documents provider; filtering is inconsistent → JS validation still applied
 */
export const GUITAR_PRO_ACCEPT = `${[...GUITAR_PRO_MIME_TYPES].join(',')},${GUITAR_PRO_SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}`;

/**
 * Returns true if the filename has a supported extension
 */
export function isSupportedGuitarProFilename(filename: string): boolean {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return false;
  const ext = filename.slice(lastDot + 1).toLowerCase();
  return GUITAR_PRO_SUPPORTED_EXTENSIONS.includes(ext as typeof GUITAR_PRO_SUPPORTED_EXTENSIONS[number]);
}

/**
 * Returns true if the File seems to be a supported Guitar Pro / MusicXML file
 * Prefer extension check; MIME types are unreliable on mobile.
 * On mobile platforms, we're more permissive since file pickers are unreliable.
 */
export function isSupportedGuitarProFile(file: File, bypassValidation = false): boolean {
  // On mobile platforms or when explicitly bypassed, skip strict validation
  if (bypassValidation || isMobilePlatform()) {
    // Still check for obvious extensions if present, but allow unknown files through
    if (file.name.includes('.')) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      // Only reject files that are clearly not music files
      const obviouslyUnsupported = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'exe', 'dmg', 'app'];
      if (ext && obviouslyUnsupported.includes(ext)) {
        return false;
      }
    }
    return true; // Let AlphaTab handle the actual format validation
  }

  // Desktop: strict validation
  if (isSupportedGuitarProFilename(file.name)) return true;
  const type = (file.type || '').toLowerCase();
  if (!type) return false;
  return (GUITAR_PRO_MIME_TYPES as readonly string[]).some((mt) => {
    if (mt.endsWith('/*')) {
      const prefix = mt.slice(0, -1); // include slash
      return type.startsWith(prefix);
    }
    return type === mt;
  });
}

/**
 * A short display string for error messages
 */
export const GUITAR_PRO_EXTENSIONS_DISPLAY = GUITAR_PRO_SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(', ');

/**
 * Debug function to help troubleshoot file type issues
 */
export function debugFileInfo(file: File): string {
  return JSON.stringify({
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    extension: file.name.split('.').pop()?.toLowerCase(),
    isMobilePlatform: isMobilePlatform(),
    isIOSPlatform: isIOSPlatform(),
    isAndroidPlatform: isAndroidPlatform(),
    passesFilenameCheck: isSupportedGuitarProFilename(file.name),
    wouldPassMobileCheck: !file.name.includes('.') || !['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'exe', 'dmg', 'app'].includes(file.name.split('.').pop()?.toLowerCase() || '')
  }, null, 2);
}


/**
 * Platform detection for iOS/iPadOS Safari quirks
 */
export function isIOSPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const platform = (navigator as unknown as { platform?: string }).platform || '';
  const maxTouchPoints = (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints || 0;
  const iOSUA = /iPad|iPhone|iPod/.test(ua);
  const iPadOS13Plus = platform === 'MacIntel' && maxTouchPoints > 1; // iPadOS masquerades as Mac
  return iOSUA || iPadOS13Plus;
}

/**
 * Platform detection for Android devices
 */
export function isAndroidPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android/.test(ua);
}

/**
 * Check if we're on a mobile platform that has unreliable file pickers
 */
export function isMobilePlatform(): boolean {
  return isIOSPlatform() || isAndroidPlatform();
}

/**
 * Returns the best `accept` value for the current platform.
 */
 // Mobile Safari/browsers ignore extensions filtering; using "*/*" opens Files and lets JS validation enforce types
 /* - Other platforms use the strict accept combining MIME + extensions
 */
export function getGuitarProAcceptForPlatform(): string {
  return isMobilePlatform() ? '*/*' : GUITAR_PRO_ACCEPT;
}
