import { AudioCapture } from './audioCapture';
import { DeepgramClient, getDeepgramApiKey } from './deepgramClient';
import {
    TranscriptResult,
    ConnectionStatus,
    RecordingState,
    TranscriptCallback,
    ErrorCallback,
    StatusCallback
} from '../types';

interface TranscriptionCallbacks {
    onTranscript: TranscriptCallback;
    onStatus?: StatusCallback;
    onError?: ErrorCallback;
}

export class TranscriptionService {
    private audioCapture: AudioCapture;
    private deepgramClient: DeepgramClient;
    private state: RecordingState = RecordingState.IDLE;
    private callbacks: TranscriptionCallbacks | null = null;

    constructor() {
        this.audioCapture = new AudioCapture({
            sampleRate: 16000,
            channels: 1,
            bitDepth: 16
        });

        const apiKey = getDeepgramApiKey();
        this.deepgramClient = new DeepgramClient({
            apiKey,
            model: 'nova-2',
            language: 'en-US',
            punctuate: true,
            interimResults: true
        });
    }

    async start(callbacks: TranscriptionCallbacks): Promise<void> {
        if (this.state !== RecordingState.IDLE) {
            return;
        }

        this.callbacks = callbacks;

        try {
            await this.deepgramClient.connect(
                (result) => this.handleTranscript(result),
                (status) => this.handleConnectionStatus(status),
                (error) => this.handleError(error)
            );

            this.updateState(RecordingState.PROCESSING);

            const silence = new Int16Array(1600);
            this.deepgramClient.send(silence);

            await this.audioCapture.start(
                (chunk) => this.handleAudioChunk(chunk),
                (error) => this.handleError(error)
            );

            this.updateState(RecordingState.RECORDING);
        } catch (error) {
            this.handleError(error as Error);
            throw error;
        }
    }

    stop(): void {
        if (this.state === RecordingState.IDLE) {
            return;
        }

        this.cleanup();
        this.updateState(RecordingState.IDLE);
    }

    getState(): RecordingState {
        return this.state;
    }

    private handleAudioChunk(chunk: Int16Array): void {
        if (this.state === RecordingState.RECORDING) {
            this.deepgramClient.send(chunk);
        }
    }

    private handleTranscript(result: TranscriptResult): void {
        if (this.callbacks?.onTranscript) {
            this.callbacks.onTranscript(result);
        }
    }

    private handleConnectionStatus(status: ConnectionStatus): void {
        if (this.callbacks?.onStatus) {
            this.callbacks.onStatus(status);
        }
    }

    private handleError(error: Error): void {
        this.cleanup();

        if (this.callbacks?.onError) {
            this.callbacks.onError(error);
        }
    }

    private updateState(newState: RecordingState): void {
        this.state = newState;
    }

    private cleanup(): void {
        this.audioCapture.stop();
        this.deepgramClient.disconnect();
        this.callbacks = null;
        this.updateState(RecordingState.IDLE);
    }
}
