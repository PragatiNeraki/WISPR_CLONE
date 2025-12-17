import {
    DeepgramConfig,
    TranscriptCallback,
    ErrorCallback,
    StatusCallback,
    ConnectionStatus,
    TranscriptResult
} from '../types';

interface DeepgramResponse {
    type: 'Results' | 'Metadata' | 'Error';
    channel?: {
        alternatives?: Array<{
            transcript: string;
            confidence: number;
        }>;
    };
    is_final?: boolean;
    speech_final?: boolean;
    duration?: number;
    error?: string;
}

export class DeepgramClient {
    private websocket: WebSocket | null = null;
    private config: DeepgramConfig;
    private isConnected = false;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 3;
    private readonly reconnectDelay = 1000;
    private reconnectTimeout: number | null = null;

    private onTranscript: TranscriptCallback | null = null;
    private onError: ErrorCallback | null = null;
    private onStatus: StatusCallback | null = null;

    constructor(config: DeepgramConfig) {
        this.config = {
            model: 'nova-2',
            language: 'en-US',
            punctuate: true,
            interimResults: true,
            ...config
        };
    }

    async connect(
        onTranscript: TranscriptCallback,
        onStatus?: StatusCallback,
        onError?: ErrorCallback
    ): Promise<void> {
        if (this.isConnected) {
            throw new Error('Already connected to Deepgram');
        }

        this.onTranscript = onTranscript;
        this.onStatus = onStatus || null;
        this.onError = onError || null;

        this.updateStatus(ConnectionStatus.CONNECTING);

        try {
            await this.initializeWebSocket();
        } catch (error) {
            this.handleError(error as Error);
            throw error;
        }
    }

    disconnect(): void {
        this.cleanup();
    }

    send(audioChunk: Int16Array): void {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            this.websocket.send(audioChunk.buffer);
        } catch (error) {
            // Silent failure - avoid console noise for frequent send operations
        }
    }

    getConnectionStatus(): ConnectionStatus {
        if (!this.websocket) return ConnectionStatus.DISCONNECTED;

        switch (this.websocket.readyState) {
            case WebSocket.CONNECTING:
                return ConnectionStatus.CONNECTING;
            case WebSocket.OPEN:
                return ConnectionStatus.CONNECTED;
            case WebSocket.CLOSING:
            case WebSocket.CLOSED:
                return ConnectionStatus.DISCONNECTED;
            default:
                return ConnectionStatus.ERROR;
        }
    }

    private async initializeWebSocket(): Promise<void> {
        return new Promise((resolve, reject) => {
            const url = this.buildWebSocketUrl();
            console.log('[Deepgram] Connecting to:', url.replace(/token=[^&]+/, 'token=***'));

            try {
                this.websocket = new WebSocket(url, ['token', this.config.apiKey]);
                this.websocket.binaryType = 'arraybuffer';

                let isResolved = false;

                this.websocket.onopen = () => {
                    console.log('[Deepgram] WebSocket opened successfully');

                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.updateStatus(ConnectionStatus.CONNECTED);


                    this.websocket!.send(
                        JSON.stringify({ type: 'KeepAlive' })
                    );

                    isResolved = true;
                    resolve();
                };


                this.websocket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.websocket.onerror = (event) => {
                    console.error('[Deepgram] WebSocket error:', event);
                };

                this.websocket.onclose = (event) => {
                    console.log('[Deepgram] WebSocket closed. Code:', event.code, 'Reason:', event.reason, 'Clean:', event.wasClean);
                    this.isConnected = false;
                    this.updateStatus(ConnectionStatus.DISCONNECTED);

                    if (!isResolved) {
                        let errorMessage = event.reason || '';


                        if (errorMessage.includes('did not receive audio data')) {
                            this.updateStatus(ConnectionStatus.CONNECTED);
                            resolve();
                            return;
                        }

                        if (event.code === 1008) {
                            errorMessage = 'Invalid Deepgram API key. Please check your .env file.';
                        } else if (event.code === 1006) {
                            errorMessage = 'Connection failed. Please check your internet connection.';
                        }

                        const error = new Error(errorMessage || 'Failed to connect to Deepgram.');
                        this.handleError(error);
                        reject(error);
                    }
                    else if (!event.wasClean) {

                        if (event.code === 1008) {
                            this.handleError(new Error('Invalid Deepgram API key. Please check your .env file.'));
                        } else if (event.code === 1006) {
                            this.handleError(new Error('Network connection lost. Attempting to reconnect...'));
                            if (this.shouldReconnect()) {
                                this.attemptReconnect();
                            }
                        } else if (this.shouldReconnect()) {
                            this.attemptReconnect();
                        }
                    }
                };
            } catch (error) {
                console.error('[Deepgram] Failed to create WebSocket:', error);
                reject(error);
            }
        });
    }

    private buildWebSocketUrl(): string {
        const baseUrl = 'wss://api.deepgram.com/v1/listen';
        const params = new URLSearchParams({
            model: this.config.model || 'nova-2',
            language: this.config.language || 'en-US',
            punctuate: String(this.config.punctuate ?? true),
            interim_results: 'true',
            encoding: 'linear16',
            sample_rate: '16000',
            channels: '1',

        });

        return `${baseUrl}?${params.toString()}`;
    }

    private handleMessage(data: string): void {
        try {
            const response: DeepgramResponse = JSON.parse(data);

            if (response.type === 'Error') {
                const errorMsg = response.error || '';

                if (errorMsg.includes('did not receive audio data')) {
                    if (this.onStatus) {
                        this.onStatus(ConnectionStatus.CONNECTED);
                    }
                    return;
                }

                this.handleError(new Error(`Transcription error: ${errorMsg}`));
                return;
            }


            if (response.type === 'Results') {
                const alternative = response.channel?.alternatives?.[0];

                if (alternative && alternative.transcript) {
                    const result: TranscriptResult = {
                        text: alternative.transcript,
                        isFinal: response.is_final || response.speech_final || false,
                        confidence: alternative.confidence,
                        timestamp: Date.now()
                    };

                    if (this.onTranscript) {
                        this.onTranscript(result);
                    }
                }
            }
        } catch (error) {
            // Silent JSON parse errors - avoid console noise
        }
    }

    private shouldReconnect(): boolean {
        return this.reconnectAttempts < this.maxReconnectAttempts;
    }

    private attemptReconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        this.reconnectTimeout = window.setTimeout(async () => {
            try {
                this.updateStatus(ConnectionStatus.CONNECTING);
                await this.initializeWebSocket();
            } catch (error) {
                if (this.shouldReconnect()) {
                    this.attemptReconnect();
                } else {
                    this.handleError(new Error('Failed to reconnect to Deepgram. Please check your connection and try again.'));
                }
            }
        }, delay);
    }

    private updateStatus(status: ConnectionStatus): void {
        if (this.onStatus) {
            this.onStatus(status);
        }
    }

    private handleError(error: Error): void {
        this.updateStatus(ConnectionStatus.ERROR);

        if (this.onError) {
            this.onError(error);
        }
    }

    private cleanup(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.websocket) {
            this.websocket.onopen = null;
            this.websocket.onmessage = null;
            this.websocket.onerror = null;
            this.websocket.onclose = null;

            if (this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.close(1000, 'Client disconnecting');
            }

            this.websocket = null;
        }

        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.onTranscript = null;
        this.onError = null;
        this.onStatus = null;

        this.updateStatus(ConnectionStatus.DISCONNECTED);
    }
}

export function getDeepgramApiKey(): string {
    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;

    if (!apiKey) {
        throw new Error(
            'Deepgram API key not found. Please set VITE_DEEPGRAM_API_KEY in your .env file'
        );
    }

    return apiKey;
}
