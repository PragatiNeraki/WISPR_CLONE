interface TranscriptDisplayProps {
    transcript: string;
    interimTranscript: string;
    error: string | null;
    onClear: () => void;
}

export function TranscriptDisplay({
    transcript,
    interimTranscript,
    error,
    onClear
}: TranscriptDisplayProps) {
    const hasContent = transcript || interimTranscript;

    return (
        <div
            style={{
                width: '100%',
                maxWidth: '800px',
                margin: '0 auto'
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: '18px',
                        color: 'var(--text-primary)'
                    }}
                >
                    Transcription
                </h2>

                {hasContent && (
                    <button
                        onClick={onClear}
                        style={{
                            padding: '6px 12px',
                            fontSize: '14px',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-alt)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface)';
                        }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Error (soft, non-jarring) */}
            {error && (
                <div
                    style={{
                        padding: '12px',
                        marginBottom: '12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: '8px',
                        color: '#fca5a5',
                        fontSize: '14px'
                    }}
                >
                    {error}
                </div>
            )}

            {/* Transcript Box */}
            <div
                style={{
                    minHeight: '200px',
                    padding: '16px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowY: 'auto',
                    maxHeight: '400px'
                }}
            >
                {!hasContent && !error && (
                    <p
                        style={{
                            color: 'var(--text-secondary)',
                            margin: 0
                        }}
                    >
                        Start recording to see transcription here…
                    </p>
                )}

                {transcript && <span>{transcript}</span>}

                {interimTranscript && (
                    <span
                        style={{
                            color: 'var(--text-secondary)',
                            fontStyle: 'italic'
                        }}
                    >
                        {transcript ? ' ' : ''}
                        {interimTranscript}
                    </span>
                )}
            </div>
        </div>
    );
}
