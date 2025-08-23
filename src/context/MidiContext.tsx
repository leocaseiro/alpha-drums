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

  // Handle MIDI messages
  const handleMidiMessage = useCallback((message: MidiMessage, deviceId: string) => {
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
    autoConnect: settings.autoConnectInputs
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
    autoConnect: settings.autoConnectOutputs
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

  // Auto-connect to selected devices when they become available
  useEffect(() => {
    inputDevices.forEach(device => {
      if (settings.selectedInputs.has(device.id) && 
          device.state === 'connected' && 
          !connectedInputs.has(device.id)) {
        connectInput(device.id);
      }
    });
  }, [inputDevices, settings.selectedInputs, connectedInputs, connectInput]);

  useEffect(() => {
    outputDevices.forEach(device => {
      if (settings.selectedOutputs.has(device.id) && 
          device.state === 'connected' && 
          !connectedOutputs.has(device.id)) {
        connectOutput(device.id);
      }
    });
  }, [outputDevices, settings.selectedOutputs, connectedOutputs, connectOutput]);

  const contextValue: MidiContextValue = {
    // Inputs
    inputDevices,
    connectedInputs,
    connectInput,
    disconnectInput,
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