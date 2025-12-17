import { AudioConfig, AudioChunkCallback, ErrorCallback } from '../types';
import { resampleBuffer, floatTo16BitPCM, convertToMono } from '../utils/audioUtils';

export class AudioCapture {
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;
    private processorNode: ScriptProcessorNode | null = null;
    private isCapturing = false;

    private config: AudioConfig = {
        sampleRate: 16000,
        channels: 1,
        bitDepth: 16
    };

    private onAudioChunk: AudioChunkCallback | null = null;
    private onError: ErrorCallback | null = null;

    constructor(config?: Partial<AudioConfig>) {
        if (config) {
            this.config = { ...this.config, ...config };
        }
    }

    async start(
        onAudioChunk: AudioChunkCallback,
        onError?: ErrorCallback
    ): Promise<void> {

        if (this.isCapturing) {
            return;
        }

        this.onAudioChunk = onAudioChunk;
        this.onError = onError || null;

        try {
            await this.initializeAudioContext();
            await this.requestMicrophoneAccess();
            this.setupAudioProcessing();
            this.isCapturing = true;
        } catch (error) {
            this.handleError(error as Error);
        }
    }

    stop(): void {
        if (!this.isCapturing) {
            return;
        }

        this.cleanup();
        this.isCapturing = false;
    }

    getState(): boolean {
        return this.isCapturing;
    }

    private async initializeAudioContext(): Promise<void> {
        this.audioContext = new AudioContext({
            sampleRate: this.config.sampleRate
        });

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    private async requestMicrophoneAccess(): Promise<void> {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: this.config.channels,
                    sampleRate: this.config.sampleRate,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
        } catch (error) {
            const err = error as DOMException;

            if (err.name === 'NotAllowedError') {
                throw new Error(
                    'Microphone permission denied. Please allow microphone access.'
                );
            } else if (err.name === 'NotFoundError') {
                throw new Error(
                    'No microphone found. Please connect a microphone.'
                );
            } else if (err.name === 'NotReadableError') {
                throw new Error(
                    'Microphone is already in use by another application.'
                );
            } else {
                throw new Error(`Failed to access microphone: ${err.message}`);
            }
        }
    }

    private setupAudioProcessing(): void {
        if (!this.audioContext || !this.mediaStream) {
            throw new Error('Audio context or media stream not initialized');
        }

        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

        const bufferSize = 4096;
        this.processorNode = this.audioContext.createScriptProcessor(
            bufferSize,
            this.config.channels,
            this.config.channels
        );

        this.processorNode.onaudioprocess = (event: AudioProcessingEvent) => {
            this.processAudioBuffer(event.inputBuffer);
        };

        this.sourceNode.connect(this.processorNode);
        this.processorNode.connect(this.audioContext.destination);
    }

    private processAudioBuffer(buffer: AudioBuffer): void {
        try {
            const channelData: Float32Array[] = [];

            for (let i = 0; i < buffer.numberOfChannels; i++) {
                channelData.push(buffer.getChannelData(i));
            }

            const mono = convertToMono(channelData);

            const resampled =
                buffer.sampleRate !== this.config.sampleRate
                    ? resampleBuffer(mono, buffer.sampleRate, this.config.sampleRate)
                    : mono;

            const pcmData = floatTo16BitPCM(resampled);

            this.onAudioChunk?.(pcmData);
        } catch {
            // Silent audio processing failure (safe)
        }
    }

    private handleError(error: Error): void {
        this.onError?.(error);
        this.cleanup();
        this.isCapturing = false;
    }

    private cleanup(): void {
        if (this.processorNode) {
            this.processorNode.disconnect();
            this.processorNode.onaudioprocess = null;
            this.processorNode = null;
        }

        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.onAudioChunk = null;
        this.onError = null;
    }
}
