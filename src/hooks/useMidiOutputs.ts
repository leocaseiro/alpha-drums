import { useState, useEffect, useCallback } from 'react';

export interface MidiOutputDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: MIDIPortDeviceState;
  connection: MIDIPortConnectionState;
  output: MIDIOutput;
}

interface UseMidiOutputsOptions {
  enableLogging?: boolean;
  autoConnect?: boolean;
}

export function useMidiOutputs(options: UseMidiOutputsOptions = {}) {
  const { enableLogging = false, autoConnect = false } = options; // Disabled by default for outputs
  
  const [devices, setDevices] = useState<MidiOutputDevice[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Set<string>>(new Set());
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);

  // Send MIDI message to a device
  const sendMessage = useCallback((deviceId: string, data: number[] | Uint8Array, timestamp?: number) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || !connectedDevices.has(deviceId)) {
      console.warn(`MIDI output device ${deviceId} not connected`);
      return false;
    }

    try {
      const uint8Array = data instanceof Uint8Array ? data : new Uint8Array(data);
      
      if (timestamp) {
        device.output.send(uint8Array, timestamp);
      } else {
        device.output.send(uint8Array);
      }

      if (enableLogging) {
        console.log(`MIDI Output [${deviceId}]:`, Array.from(uint8Array));
      }
      
      return true;
    } catch (err) {
      console.error('Failed to send MIDI message:', err);
      return false;
    }
  }, [devices, connectedDevices, enableLogging]);

  // Send note on message
  const sendNoteOn = useCallback((deviceId: string, note: number, velocity: number = 127, channel: number = 0) => {
    const status = 0x90 | (channel & 0x0f); // Note on + channel
    return sendMessage(deviceId, [status, note & 0x7f, velocity & 0x7f]);
  }, [sendMessage]);

  // Send note off message
  const sendNoteOff = useCallback((deviceId: string, note: number, velocity: number = 0, channel: number = 0) => {
    const status = 0x80 | (channel & 0x0f); // Note off + channel
    return sendMessage(deviceId, [status, note & 0x7f, velocity & 0x7f]);
  }, [sendMessage]);

  // Send control change message
  const sendControlChange = useCallback((deviceId: string, controller: number, value: number, channel: number = 0) => {
    const status = 0xb0 | (channel & 0x0f); // Control change + channel
    return sendMessage(deviceId, [status, controller & 0x7f, value & 0x7f]);
  }, [sendMessage]);

  // Refresh devices list
  const refreshDevices = useCallback(() => {
    if (!midiAccess) return;

    const deviceList: MidiOutputDevice[] = [];
    
    midiAccess.outputs.forEach((output) => {
      deviceList.push({
        id: output.id,
        name: output.name || 'Unknown Device',
        manufacturer: output.manufacturer || 'Unknown',
        state: output.state,
        connection: output.connection,
        output
      });
    });

    setDevices(deviceList);
  }, [midiAccess]);

  // Connect to a device
  const connectDevice = useCallback((deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return false;

    try {
      setConnectedDevices(prev => new Set(prev).add(deviceId));
      
      if (enableLogging) {
        console.log(`Connected to MIDI output device: ${device.name}`);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to connect to MIDI output device:', err);
      return false;
    }
  }, [devices, enableLogging]);

  // Disconnect from a device
  const disconnectDevice = useCallback((deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return false;

    try {
      setConnectedDevices(prev => {
        const next = new Set(prev);
        next.delete(deviceId);
        return next;
      });
      
      if (enableLogging) {
        console.log(`Disconnected from MIDI output device: ${device.name}`);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to disconnect from MIDI output device:', err);
      return false;
    }
  }, [devices, enableLogging]);

  // Disconnect all devices
  const disconnectAll = useCallback(() => {
    connectedDevices.forEach(deviceId => {
      disconnectDevice(deviceId);
    });
  }, [connectedDevices, disconnectDevice]);

  // Initialize MIDI
  useEffect(() => {
    const initMidi = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!navigator.requestMIDIAccess) {
          throw new Error('Web MIDI API not supported in this browser');
        }

        const access = await navigator.requestMIDIAccess();
        setMidiAccess(access);
        setIsSupported(true);

        // Set up state change listeners (define inline to avoid stale closure)
        access.onstatechange = (event) => {
          console.log('MIDI state changed:', event);
          // Force refresh devices when state changes
          const deviceList: MidiOutputDevice[] = [];
          
          access.outputs.forEach((output) => {
            deviceList.push({
              id: output.id,
              name: output.name || 'Unknown Device',
              manufacturer: output.manufacturer || 'Unknown',
              state: output.state,
              connection: output.connection,
              output
            });
          });

          setDevices(deviceList);
        };

        // Initial devices scan
        refreshDevices();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize MIDI';
        setError(errorMessage);
        setIsSupported(false);
        console.error('MIDI initialization failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initMidi();
  }, []);

  // Update devices when midiAccess changes
  useEffect(() => {
    if (midiAccess) {
      refreshDevices();
    }
  }, [midiAccess, refreshDevices]);

  // Auto-connect logic (separate from refreshDevices to avoid loops)
  useEffect(() => {
    if (autoConnect && devices.length === 1) {
      const device = devices[0];
      if (device.state === 'connected' && !connectedDevices.has(device.id)) {
        connectDevice(device.id);
      }
    }
  }, [devices, autoConnect, connectedDevices, connectDevice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectAll();
    };
  }, [disconnectAll]);

  return {
    devices,
    connectedDevices,
    isSupported,
    isLoading,
    error,
    connectDevice,
    disconnectDevice,
    disconnectAll,
    refreshDevices,
    sendMessage,
    sendNoteOn,
    sendNoteOff,
    sendControlChange
  };
}