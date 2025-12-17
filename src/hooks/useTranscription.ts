import { useState, useCallback, useRef, useEffect } from 'react';
import { TranscriptionService } from '../services/transcriptionService';
import {
    RecordingState,
    ConnectionStatus,
    TranscriptResult
} from '../types';

interface UseTranscriptionResult {
    transcript: string;
    interimTranscript: string;
    isRecording: boolean;
    recordingState: RecordingState;
    connectionStatus: ConnectionStatus;
    error: string | null;
    hint: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    clearTranscript: () => void;
}

export function useTranscription(): UseTranscriptionResult {
    const [transcript, setTranscript] = useState<string>('');
    const [interimTranscript, setInterimTranscript] = useState<string>('');
    const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.IDLE);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
    const [error, setError] = useState<string | null>(null);
    const [hint, setHint] = useState<string | null>(null);

    const serviceRef = useRef<TranscriptionService | null>(null);

    useEffect(() => {
        serviceRef.current = new TranscriptionService();

        return () => {
            if (serviceRef.current) {
                serviceRef.current.stop();
            }
        };
    }, []);

    const startRecording = useCallback(async () => {
        if (!serviceRef.current) return;

        setError(null);
        setHint(null);
        setTranscript('');
        setInterimTranscript('');

        try {
            await serviceRef.current.start({
                onTranscript: (result: TranscriptResult) => {
                    setHint(null);

                    if (result.isFinal) {
                        setTranscript(prev => {
                            const newText = prev + (prev ? ' ' : '') + result.text;
                            return newText;
                        });
                        setInterimTranscript('');
                    } else {
                        setInterimTranscript(result.text);
                    }
                },

                onStatus: (status: ConnectionStatus) => {
                    setConnectionStatus(status);
                },
                onError: (err: Error) => {
                    // 🎤 Silence timeout → friendly hint, not an error
                    if (err.message.includes('did not receive audio data')) {
                        setHint('Say something to start transcription 🎤');
                        return;
                    }

                    setError(err.message);
                    setRecordingState(RecordingState.ERROR);
                }

            });

            setRecordingState(RecordingState.RECORDING);
        } catch (err) {
            setError((err as Error).message);
            setRecordingState(RecordingState.ERROR);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (serviceRef.current) {
            serviceRef.current.stop();
            setRecordingState(RecordingState.IDLE);
            setConnectionStatus(ConnectionStatus.DISCONNECTED);
            setInterimTranscript('');
        }
    }, []);

    const clearTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        setError(null);
    }, []);

    return {
        transcript,
        interimTranscript,
        isRecording: recordingState === RecordingState.RECORDING,
        recordingState,
        connectionStatus,
        error,
        hint,
        startRecording,
        stopRecording,
        clearTranscript
    };
}
