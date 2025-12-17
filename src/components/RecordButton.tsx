interface RecordButtonProps {
    isRecording: boolean;
    onStart: () => void;
    onStop: () => void;
    disabled?: boolean;
}

export function RecordButton({
    isRecording,
    onStart,
    onStop,
    disabled
}: RecordButtonProps) {
    const handleClick = () => {
        if (disabled) return;

        if (isRecording) {
            onStop();
        } else {
            onStart();
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
            }}
        >
            <button
                onClick={handleClick}
                disabled={disabled}
                style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: isRecording ? '#ef4444' : '#3b82f6',
                    color: 'white',
                    fontSize: '48px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isRecording
                        ? '0 0 0 10px rgba(239, 68, 68, 0.25)'
                        : '0 8px 20px rgba(59, 130, 246, 0.35)',
                    opacity: disabled ? 0.5 : 1
                }}
            >
                {isRecording ? '⏸' : '🎙️'}
            </button>

            <div
                style={{
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#6b7280'
                }}
            >
                <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>
                    {isRecording ? 'Click to stop recording' : 'Click to start recording'}
                </p>
            </div>
        </div>
    );
}
