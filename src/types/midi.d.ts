// Web MIDI API type definitions
declare global {
  interface Navigator {
    requestMIDIAccess(): Promise<MIDIAccess>;
  }

  interface MIDIAccess extends EventTarget {
    readonly inputs: MIDIInputMap;
    readonly outputs: MIDIOutputMap;
    readonly sysexEnabled: boolean;
    onstatechange: ((event: MIDIConnectionEvent) => void) | null;
  }

  interface MIDIInputMap extends ReadonlyMap<string, MIDIInput> {}
  interface MIDIOutputMap extends ReadonlyMap<string, MIDIOutput> {}

  interface MIDIPort extends EventTarget {
    readonly id: string;
    readonly manufacturer?: string;
    readonly name?: string;
    readonly type: MIDIPortType;
    readonly version?: string;
    readonly state: MIDIPortDeviceState;
    readonly connection: MIDIPortConnectionState;
    onstatechange: ((event: MIDIConnectionEvent) => void) | null;
    open(): Promise<MIDIPort>;
    close(): Promise<MIDIPort>;
  }

  interface MIDIInput extends MIDIPort {
    readonly type: "input";
    onmidimessage: ((event: MIDIMessageEvent) => void) | null;
  }

  interface MIDIOutput extends MIDIPort {
    readonly type: "output";
    send(data: Uint8Array, timestamp?: number): void;
    clear(): void;
  }

  interface MIDIMessageEvent extends Event {
    readonly data: Uint8Array;
    readonly timeStamp: number;
  }

  interface MIDIConnectionEvent extends Event {
    readonly port: MIDIPort;
  }

  type MIDIPortType = "input" | "output";
  type MIDIPortDeviceState = "disconnected" | "connected";
  type MIDIPortConnectionState = "open" | "closed" | "pending";
}