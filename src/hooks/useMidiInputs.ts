import { useState, useEffect, useCallback } from 'react';

export interface MidiInputDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: MIDIPortDeviceState;
  connection: MIDIPortConnectionState;
  input: MIDIInput;
}

export interface MidiMessage {
  timestamp: number;
  data: Uint8Array;
  note?: number;
  velocity?: number;
  type: 'noteOn' | 'noteOff' | 'controlChange' | 'unknown';
  channel?: number;
}

interface UseMidiInputsOptions {
  onMidiMessage?: (message: MidiMessage, deviceId: string) => void;
  enableLogging?: boolean;
  autoConnect?: boolean;
}

export function useMidiInputs(options: UseMidiInputsOptions = {}) {
  const { onMidiMessage, enableLogging = false, autoConnect = true } = options;
  
  const [devices, setDevices] = useState<MidiInputDevice[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Set<string>>(new Set());
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);

  // Parse MIDI message
  const parseMidiMessage = useCallback((data: Uint8Array, timestamp: number): MidiMessage => {
    const [status, note, velocity] = data;
    const command = status & 0xf0;
    const channel = status & 0x0f;

    let type: MidiMessage['type'] = 'unknown';
    
    switch (command) {
      case 0x80: // Note off
        type = 'noteOff';
        break;
      case 0x90: // Note on
        type = velocity > 0 ? 'noteOn' : 'noteOff';
        break;
      case 0xb0: // Control change
        type = 'controlChange';
        break;
    }

    return {
      timestamp,
      data,
      note,
      velocity,
      type,
      channel
    };
  }, []);

  // Handle MIDI message
  const handleMidiMessage = useCallback((event: MIDIMessageEvent, deviceId: string) => {
    if (!event.data) return;
    const message = parseMidiMessage(event.data, event.timeStamp);
    
    if (enableLogging) {
      console.log(`MIDI Input [${deviceId}]:`, {
        type: message.type,
        note: message.note,
        velocity: message.velocity,
        channel: message.channel,
        timestamp: message.timestamp
      });
    }

    onMidiMessage?.(message, deviceId);
  }, [parseMidiMessage, onMidiMessage, enableLogging]);

  // Refresh devices list
  const refreshDevices = useCallback(() => {
    if (!midiAccess) return;

    const deviceList: MidiInputDevice[] = [];
    
    midiAccess.inputs.forEach((input) => {
      deviceList.push({
        id: input.id,
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || 'Unknown',
        state: input.state,
        connection: input.connection,
        input
      });
    });

    setDevices(deviceList);
  }, [midiAccess]);

  // Connect to a device
  const connectDevice = useCallback((deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return false;

    try {
      device.input.onmidimessage = (event: MIDIMessageEvent) => {
        handleMidiMessage(event, deviceId);
      };

      setConnectedDevices(prev => new Set(prev).add(deviceId));
      
      if (enableLogging) {
        console.log(`Connected to MIDI device: ${device.name}`);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to connect to MIDI device:', err);
      return false;
    }
  }, [devices, handleMidiMessage, enableLogging]);

  // Disconnect from a device
  const disconnectDevice = useCallback((deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return false;

    try {
      device.input.onmidimessage = null;
      setConnectedDevices(prev => {
        const next = new Set(prev);
        next.delete(deviceId);
        return next;
      });
      
      if (enableLogging) {
        console.log(`Disconnected from MIDI device: ${device.name}`);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to disconnect from MIDI device:', err);
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

        // Set up state change listeners
        access.onstatechange = (event) => {
          console.log('MIDI state changed:', event);
          refreshDevices();
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
    refreshDevices
  };
}