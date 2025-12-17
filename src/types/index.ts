export enum RecordingState {
  IDLE = 'idle',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  ERROR = 'error'
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

export interface TranscriptResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
  timestamp?: number;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: 16;
}

export interface DeepgramConfig {
  apiKey: string;
  model?: string;
  language?: string;
  punctuate?: boolean;
  interimResults?: boolean;
}

export type AudioChunkCallback = (chunk: Int16Array) => void;
export type TranscriptCallback = (result: TranscriptResult) => void;
export type ErrorCallback = (error: Error) => void;
export type StatusCallback = (status: ConnectionStatus) => void;
