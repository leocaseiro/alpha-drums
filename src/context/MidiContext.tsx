'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useMidiInputs, MidiMessage } from '@/hooks/useMidiInputs';
import { useMidiOutputs } from '@/hooks/useMidiOutputs';

export interface MidiHistory {
  id: string;
  timestamp: number;
  deviceId: string;
  deviceName: string;
  message: MidiMessage;
}

interface MidiSettings {
  enableLogging: boolean;
  autoConnectInputs: boolean;
  autoConnectOutputs: boolean;
  selectedInputs: Set<string>;
  selectedOutputs: Set<string>;
}

interface MidiContextValue {
  // Inputs
  inputDevices: ReturnType<typeof useMidiInputs>['devices'];
  connectedInputs: ReturnType<typeof useMidiInputs>['connectedDevices'];
  connectInput: (deviceId: string) => boolean;
  disconnectInput: (deviceId: string) => boolean;
  disconnectAllInputs: () => void;
  refreshInputs: () => void;

  // Outputs
  outputDevices: ReturnType<typeof useMidiOutputs>['devices'];
  connectedOutputs: ReturnType<typeof useMidiOutputs>['connectedDevices'];
  connectOutput: (deviceId: string) => boolean;
  disconnectOutput: (deviceId: string) => boolean;
  disconnectAllOutputs: () => void;
  refreshOutputs: () => void;
  sendMessage: ReturnType<typeof useMidiOutputs>['sendMessage'];
  sendNoteOn: ReturnType<typeof useMidiOutputs>['sendNoteOn'];
  sendNoteOff: ReturnType<typeof useMidiOutputs>['sendNoteOff'];

  // State
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;

  // Settings
  settings: MidiSettings;
  updateSettings: (updates: Partial<MidiSettings>) => void;

  // History
  history: MidiHistory[];
  clearHistory: () => void;
  maxHistorySize: number;
  setMaxHistorySize: (size: number) => void;
}

const MidiContext = createContext<MidiContextValue | undefined>(undefined);

export function useMidi() {
  const context = useContext(MidiContext);
  if (!context) {
    throw new Error('useMidi must be used within a MidiProvider');
  }
  return context;
}

interface MidiProviderProps {
  children: React.ReactNode;
  maxHistorySize?: number;
}

export function MidiProvider({ children, maxHistorySize: initialMaxHistorySize = 1000 }: MidiProviderProps) {
  const [history, setHistory] = useState<MidiHistory[]>([]);
  const [maxHistorySize, setMaxHistorySize] = useState(initialMaxHistorySize);
  const [settings, setSettings] = useState<MidiSettings>(() => {
    // Try to load settings from localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('alpha-drums-midi-settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            enableLogging: parsed.enableLogging || false,
            autoConnectInputs: parsed.autoConnectInputs || true,
            autoConnectOutputs: parsed.autoConnectOutputs || false,
            selectedInputs: new Set(parsed.selectedInputs || []),
            selectedOutputs: new Set(parsed.selectedOutputs || [])
          };
        }
      } catch (error) {
        console.warn('Failed to load MIDI settings from localStorage:', error);
      }
    }
    return {
      enableLogging: false,
      autoConnectInputs: true,
      autoConnectOutputs: false,
      selectedInputs: new Set<string>(),
      selectedOutputs: new Set<string>()
    };
  });

  // Handle MIDI messages (only from connected devices)
  const handleMidiMessage = useCallback((message: MidiMessage, deviceId: string) => {
    console.log(`MIDI message from device ${deviceId}:`, message.type, message.note, message.velocity);
    
    const historyEntry: MidiHistory = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      deviceId,
      deviceName: deviceId, // Use deviceId as fallback, will be updated by effect
      message
    };

    setHistory(prev => {
      const newHistory = [historyEntry, ...prev];
      return newHistory.slice(0, maxHistorySize);
    });
  }, [maxHistorySize]);

  // Initialize MIDI hooks
  const {
    devices: inputDevices,
    connectedDevices: connectedInputs,
    connectDevice: connectInput,
    disconnectDevice: disconnectInput,
    disconnectAll: disconnectAllInputs,
    refreshDevices: refreshInputs,
    isSupported: inputsSupported,
    isLoading: inputsLoading,
    error: inputsError
  } = useMidiInputs({
    onMidiMessage: handleMidiMessage,
    enableLogging: settings.enableLogging,
    autoConnect: false // Disable hook auto-connect, handle it manually
  });

  const {
    devices: outputDevices,
    connectedDevices: connectedOutputs,
    connectDevice: connectOutput,
    disconnectDevice: disconnectOutput,
    disconnectAll: disconnectAllOutputs,
    refreshDevices: refreshOutputs,
    sendMessage,
    sendNoteOn,
    sendNoteOff,
    isSupported: outputsSupported,
    isLoading: outputsLoading,
    error: outputsError
  } = useMidiOutputs({
    enableLogging: settings.enableLogging,
    autoConnect: false // Disable hook auto-connect, handle it manually
  });

  // Update settings
  const updateSettings = useCallback((updates: Partial<MidiSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          const toSave = {
            ...newSettings,
            selectedInputs: Array.from(newSettings.selectedInputs),
            selectedOutputs: Array.from(newSettings.selectedOutputs)
          };
          localStorage.setItem('alpha-drums-midi-settings', JSON.stringify(toSave));
        } catch (error) {
          console.warn('Failed to save MIDI settings to localStorage:', error);
        }
      }
      
      return newSettings;
    });
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Update device names in history when devices change
  useEffect(() => {
    setHistory(prev => 
      prev.map(entry => {
        const device = inputDevices.find(d => d.id === entry.deviceId);
        return device && device.name !== entry.deviceName
          ? { ...entry, deviceName: device.name }
          : entry;
      })
    );
  }, [inputDevices]);

  // Helper function to load manually disconnected devices from localStorage
  const loadManuallyDisconnectedInputs = (): Set<string> => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('alpha-drums-manually-disconnected-inputs');
        if (saved) {
          return new Set<string>(JSON.parse(saved));
        }
      } catch (error) {
        console.warn('Failed to load manually disconnected inputs from localStorage:', error);
      }
    }
    return new Set<string>();
  };

  // Restore connections from settings on initial load or when devices change.
  const hasRestoredInputsRef = React.useRef(false);
  const manuallyDisconnectedInputsRef = React.useRef(loadManuallyDisconnectedInputs());

  // Helper functions to persist manually disconnected devices
  const saveManuallyDisconnectedInputs = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'alpha-drums-manually-disconnected-inputs', 
          JSON.stringify(Array.from(manuallyDisconnectedInputsRef.current))
        );
      } catch (error) {
        console.warn('Failed to save manually disconnected inputs to localStorage:', error);
      }
    }
  }, []);

  // Clean up manually disconnected devices that are no longer available
  useEffect(() => {
    const currentDeviceIds = new Set(inputDevices.map(d => d.id));
    const manuallyDisconnected = manuallyDisconnectedInputsRef.current;
    let needsSave = false;

    for (const deviceId of manuallyDisconnected) {
      if (!currentDeviceIds.has(deviceId)) {
        manuallyDisconnected.delete(deviceId);
        needsSave = true;
      }
    }

    if (needsSave) {
      saveManuallyDisconnectedInputs();
    }
  }, [inputDevices, saveManuallyDisconnectedInputs]);
  useEffect(() => {
    // Only run restore logic once per page load, or if the number of devices changes.
    if (hasRestoredInputsRef.current && inputDevices.length > 0) return;

    const devicesToRestore = inputDevices.filter(
      device => settings.selectedInputs.has(device.id) && device.state === 'connected'
    );

    if (devicesToRestore.length > 0) {
      console.log('Restoring input connections from settings...');
      devicesToRestore.forEach(device => {
        if (!connectedInputs.has(device.id)) {
          console.log(`Restoring input: ${device.name}`);
          connectInput(device.id);
        }
      });
    }

    if (inputDevices.length > 0) {
      hasRestoredInputsRef.current = true;
    }
  }, [inputDevices, settings.selectedInputs, connectInput, connectedInputs]);

  const hasRestoredOutputsRef = React.useRef(false);
  useEffect(() => {
    if (hasRestoredOutputsRef.current && outputDevices.length > 0) return;

    const devicesToRestore = outputDevices.filter(
      device => settings.selectedOutputs.has(device.id) && device.state === 'connected'
    );

    if (devicesToRestore.length > 0) {
      console.log('Restoring output connections from settings...');
      devicesToRestore.forEach(device => {
        if (!connectedOutputs.has(device.id)) {
          console.log(`Restoring output: ${device.name}`);
          connectOutput(device.id);
        }
      });
    }

    if (outputDevices.length > 0) {
      hasRestoredOutputsRef.current = true;
    }
  }, [outputDevices, settings.selectedOutputs, connectOutput, connectedOutputs]);


  // Auto-connect new devices if the setting is enabled.
  useEffect(() => {
    if (!settings.autoConnectInputs) return;

    // Only auto-connect devices that are truly new (not previously connected or manually disconnected)
    const newlyConnected = inputDevices.filter(
      device => device.state === 'connected' && 
                !connectedInputs.has(device.id) && 
                !settings.selectedInputs.has(device.id) &&
                !manuallyDisconnectedInputsRef.current.has(device.id) &&
                hasRestoredInputsRef.current // Only auto-connect after initial restore
    );

    if (newlyConnected.length > 0) {
      console.log('Auto-connecting new input devices...');
      newlyConnected.forEach(device => {
        console.log(`Auto-connecting input: ${device.name}`);
        connectInput(device.id);
        updateSettings({
          selectedInputs: new Set([...settings.selectedInputs, device.id])
        });
      });
    }
  }, [inputDevices, settings.autoConnectInputs, connectedInputs, settings.selectedInputs, connectInput, updateSettings]);

  // Auto-connect new output devices
  useEffect(() => {
    if (!settings.autoConnectOutputs) return;

    const newlyConnected = outputDevices.filter(
      device => device.state === 'connected' && !connectedOutputs.has(device.id) && !settings.selectedOutputs.has(device.id)
    );

    if (newlyConnected.length > 0) {
      console.log('Auto-connecting new output devices...');
      newlyConnected.forEach(device => {
        console.log(`Auto-connecting output: ${device.name}`);
        connectOutput(device.id);
        updateSettings({
          selectedOutputs: new Set([...settings.selectedOutputs, device.id])
        });
      });
    }
  }, [outputDevices, settings.autoConnectOutputs, connectedOutputs, settings.selectedOutputs, connectOutput, updateSettings]);

  // Wrapper functions to track manual disconnections
  const connectInputWrapper = useCallback((deviceId: string) => {
    const result = connectInput(deviceId);
    if (result) {
      // Remove from manually disconnected list when manually connected
      manuallyDisconnectedInputsRef.current.delete(deviceId);
      saveManuallyDisconnectedInputs();
    }
    return result;
  }, [connectInput, saveManuallyDisconnectedInputs]);

  const disconnectInputWrapper = useCallback((deviceId: string) => {
    const result = disconnectInput(deviceId);
    if (result) {
      // Add to manually disconnected list when manually disconnected
      manuallyDisconnectedInputsRef.current.add(deviceId);
      saveManuallyDisconnectedInputs();
    }
    return result;
  }, [disconnectInput, saveManuallyDisconnectedInputs]);

  const contextValue: MidiContextValue = {
    // Inputs
    inputDevices,
    connectedInputs,
    connectInput: connectInputWrapper,
    disconnectInput: disconnectInputWrapper,
    disconnectAllInputs,
    refreshInputs,

    // Outputs
    outputDevices,
    connectedOutputs,
    connectOutput,
    disconnectOutput,
    disconnectAllOutputs,
    refreshOutputs,
    sendMessage,
    sendNoteOn,
    sendNoteOff,

    // State
    isSupported: inputsSupported || outputsSupported,
    isLoading: inputsLoading || outputsLoading,
    error: inputsError || outputsError,

    // Settings
    settings,
    updateSettings,

    // History
    history,
    clearHistory,
    maxHistorySize,
    setMaxHistorySize
  };

  return (
    <MidiContext.Provider value={contextValue}>
      {children}
    </MidiContext.Provider>
  );
}